import { DigitalTwinState, TelemetryData, Incident, SeverityLevel, OccupantInteractionState } from '../types';
import { DEFAULT_INITIAL_TWIN } from './defaultState';

const BASE_URL = '/api';

// In-memory client mirror so the UI runs with 0ms latency even without an active backend
let localTwin: DigitalTwinState = JSON.parse(JSON.stringify(DEFAULT_INITIAL_TWIN));
let localIncidents: Incident[] = [];
let localListeners: Array<(twin: DigitalTwinState) => void> = [];

export function subscribeLocalTwin(fn: (twin: DigitalTwinState) => void) {
  localListeners.push(fn);
  return () => {
    localListeners = localListeners.filter(l => l !== fn);
  };
}

function notifyLocalUpdate() {
  localTwin.lastUpdated = new Date().toISOString();
  localListeners.forEach(fn => fn(localTwin));
}

export const api = {
  async getTwinState(vehicleId = 'VEH-ERS-01'): Promise<DigitalTwinState> {
    try {
      const res = await fetch(`${BASE_URL}/twin/${vehicleId}/state`, { signal: AbortSignal.timeout(1500) });
      if (!res.ok) throw new Error('Backend offline');
      const data = await res.json();
      localTwin = data;
      return data;
    } catch {
      return localTwin;
    }
  },

  async getTelemetryHistory(vehicleId = 'VEH-ERS-01', limit = 40): Promise<TelemetryData[]> {
    try {
      const res = await fetch(`${BASE_URL}/twin/${vehicleId}/telemetry?limit=${limit}`, { signal: AbortSignal.timeout(1500) });
      if (!res.ok) throw new Error('Backend offline');
      return await res.json();
    } catch {
      return localTwin.latestTelemetry ? [localTwin.latestTelemetry] : [];
    }
  },

  async startSimulation(vehicleId = 'VEH-ERS-01', scenario = 'normal_driving') {
    try {
      const res = await fetch(`${BASE_URL}/simulations/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, scenario }),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch {}

    // Local simulation fallback
    localTwin.status = 'driving';
    localTwin.workflowState = 'SENSING';
    localTwin.isSimulating = true;
    localTwin.activeScenario = scenario;
    if (localTwin.stages.SENSING) {
      localTwin.stages.SENSING.status = 'active';
      localTwin.stages.SENSING.startedAt = new Date().toISOString();
      localTwin.stages.SENSING.outcomeSummary = 'Continuous sensing online';
    }
    notifyLocalUpdate();
    return { success: true, message: 'Simulation started locally' };
  },

  async pauseSimulation() {
    try {
      const res = await fetch(`${BASE_URL}/simulations/pause`, { method: 'POST', signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}

    localTwin.isSimulating = !localTwin.isSimulating;
    notifyLocalUpdate();
    return { success: true };
  },

  async resetSimulation(vehicleId = 'VEH-ERS-01') {
    try {
      const res = await fetch(`${BASE_URL}/simulations/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId }),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch {}

    localTwin = JSON.parse(JSON.stringify(DEFAULT_INITIAL_TWIN));
    notifyLocalUpdate();
    return { success: true, message: 'Twin reset locally' };
  },

  async triggerAccident(
    severity: SeverityLevel = 'high',
    hazards: string[] = [],
    occupantResponse: 'safe' | 'needs_help' | 'no_response' = 'needs_help'
  ) {
    try {
      const res = await fetch(`${BASE_URL}/simulations/accident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ severity, hazards, occupantResponse }),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch {}

    // Local crash simulation logic
    const isCritical = severity === 'critical';
    const impactG = isCritical ? 8.4 : severity === 'high' ? 6.2 : severity === 'moderate' ? 4.1 : 2.8;
    const speedDrop = isCritical ? 55 : severity === 'high' ? 40 : 25;
    const now = new Date().toISOString();
    const incidentId = `INC-${Date.now().toString(36).toUpperCase()}`;

    localTwin.activeIncidentId = incidentId;
    localTwin.status = hazards.length > 0 ? 'hazard_detected' : 'impact_detected';
    localTwin.workflowState = 'ACCIDENT_DETECTED';

    if (localTwin.latestTelemetry) {
      localTwin.latestTelemetry.accelerationG = impactG;
      localTwin.latestTelemetry.speedKph = Math.max(0, localTwin.latestTelemetry.speedKph - speedDrop);
      localTwin.latestTelemetry.speedDelta1s = speedDrop;
      localTwin.latestTelemetry.airbagDeployed = isCritical || severity === 'high';
      localTwin.latestTelemetry.hazardsDetected = hazards;
      localTwin.latestTelemetry.timestamp = now;
    }

    localTwin.reasoning = {
      severity,
      hazards,
      occupantStatus: occupantResponse === 'safe' ? 'responsive' : occupantResponse === 'needs_help' ? 'needs_assistance' : 'unresponsive',
      recommendedAction: hazards.length > 0 ? 'evacuate_if_safe' : 'stay_inside',
      guidance: hazards.length > 0
        ? [
            'CRITICAL HAZARD: Smoke or fire detected near vehicle engine bay.',
            'Unbuckle seatbelt and evacuate immediately if safe from traffic.',
            'Move 50 meters away behind roadside safety barrier.'
          ]
        : [
            'Impact detected. Remain inside vehicle with seatbelts fastened.',
            'Keep hazard flashers on. Await emergency responder triage.'
          ],
      confidence: 0.94,
      evidence: [
        `IMU peak resultant force: ${impactG.toFixed(1)}G`,
        `Speed loss: -${speedDrop} km/h`,
        isCritical || severity === 'high' ? 'Airbag pyrotechnic deployment signal active' : 'Restraint pretensioners deployed'
      ],
      isSimulation: true,
      timestamp: now,
      ruleVersion: 'ERS-Reasoning-v2.4'
    };

    // Initialize local occupant dialog
    localTwin.dialog = {
      triageStep: 'RESPONSIVENESS',
      messages: [
        {
          id: `MSG-${Date.now()}`,
          sender: 'assistant',
          text: hazards.length > 0
            ? 'CRITICAL HAZARD: Active smoke/fire detected! EVACUATE VEHICLE IMMEDIATELY IF SAFE!'
            : 'HIGH IMPACT COLLISION DETECTED! Airbag signals active. Can you speak or move?',
          timestamp: now,
          category: 'prompt'
        }
      ],
      availableQuickReplies: hazards.length > 0
        ? ['Evacuating now', 'Door is jammed / stuck!', 'Clear of vehicle behind barrier', 'Smoke entering cabin quickly!']
        : ['I am conscious and speaking', 'Severe bleeding / deep cut', 'Cannot move / trapped in seat', 'Severe neck or back pain'],
      reportedInjuries: [],
      reportedHazards: hazards,
      canMoveSafely: hazards.length === 0,
      needsImmediateRescue: hazards.length > 0 || isCritical,
      activeInstructions: hazards.length > 0
        ? [
            {
              id: 'INST-EVAC-1',
              title: 'Emergency Evacuation',
              description: 'Unbuckle immediately. Check mirror for traffic before opening door. Move 50m upwind.',
              priority: 'critical',
              type: 'evacuation'
            }
          ]
        : [
            {
              id: 'INST-STABILIZE-1',
              title: 'Spinal Alignment',
              description: 'Keep your head and neck still against headrest. Avoid twisting.',
              priority: 'high',
              type: 'first_aid'
            }
          ]
    };

    // Progression timer
    setTimeout(() => {
      localTwin.workflowState = 'AI_REASONING';
      notifyLocalUpdate();
      setTimeout(() => {
        localTwin.workflowState = 'SAFETY_DECISION';
        notifyLocalUpdate();
        setTimeout(() => {
          localTwin.workflowState = 'OCCUPANT_GUIDANCE';
          notifyLocalUpdate();
          setTimeout(() => {
            localTwin.workflowState = 'EMERGENCY_COORDINATION';
            notifyLocalUpdate();
          }, 1800);
        }, 1800);
      }, 1800);
    }, 1200);

    notifyLocalUpdate();
    return { success: true, message: 'Accident simulated locally' };
  },

  async recordDriverResponse(vehicleId = 'VEH-ERS-01', response: 'safe' | 'needs_help' | 'no_response') {
    try {
      const res = await fetch(`${BASE_URL}/simulations/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, response }),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch {}

    if (response === 'safe') {
      localTwin.workflowState = 'DRIVER_CANCELLED';
      localTwin.status = 'resolved';
    } else {
      localTwin.workflowState = 'EMERGENCY_COORDINATION';
    }
    notifyLocalUpdate();
    return { success: true };
  },

  async sendOccupantReply(vehicleId = 'VEH-ERS-01', text: string) {
    try {
      const res = await fetch(`${BASE_URL}/simulations/dialog/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, text }),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) {
        const data = await res.json();
        localTwin = data.twin;
        notifyLocalUpdate();
        return data;
      }
    } catch {}

    // Local dialog processing fallback
    const now = new Date().toISOString();
    const lower = text.toLowerCase();

    localTwin.dialog.messages.push({
      id: `OCC-${Date.now()}`,
      sender: 'occupant',
      text,
      timestamp: now
    });

    let assistantReply = '';
    let nextReplies: string[] = [];

    if (lower.includes('safe') || lower.includes('no injuries') || lower.includes('pothole') || lower.includes('all okay')) {
      localTwin.dialog.canMoveSafely = true;
      assistantReply = 'Understood, no injuries reported. Do you wish to cancel emergency dispatch?';
      nextReplies = ['Yes, cancel dispatch (I am safe)', 'Keep roadside assistance on standby'];
    } else if (lower.includes('cancel dispatch') || lower.includes('yes, cancel')) {
      assistantReply = 'Emergency dispatch cancelled. Incident closed as safe. Safe travels.';
      localTwin.workflowState = 'DRIVER_CANCELLED';
      localTwin.status = 'resolved';
      nextReplies = [];
    } else if (lower.includes('bleed') || lower.includes('blood') || lower.includes('cut')) {
      if (!localTwin.dialog.reportedInjuries.includes('Severe Bleeding')) {
        localTwin.dialog.reportedInjuries.push('Severe Bleeding');
      }
      assistantReply = 'FIRST AID INSTRUCTION: Apply firm, continuous direct pressure to the wound with clean cloth or dressing. Do NOT remove penetrating objects. Elevate injured limb.';
      localTwin.dialog.activeInstructions.unshift({
        id: 'INST-BLEED',
        title: 'Hemorrhage Control (Direct Pressure)',
        description: 'Maintain firm, constant pressure for at least 10 minutes without lifting dressing.',
        priority: 'critical',
        type: 'first_aid'
      });
      nextReplies = ['Pressure applied, bleeding slowing', 'Bleeding continues heavily', 'I can exit vehicle safely'];
    } else if (lower.includes('trapped') || lower.includes('jammed') || lower.includes('stuck')) {
      localTwin.dialog.needsImmediateRescue = true;
      assistantReply = 'RESCUE INSTRUCTION: Dispatch notified that vehicle door is jammed. Try passenger door. If fire threatens, kick lower corner of side window. Heavy rescue units dispatched.';
      localTwin.dialog.activeInstructions.unshift({
        id: 'INST-TRAP',
        title: 'Extrication & Entrapment Protocol',
        description: 'Avoid twisting twisted limbs. Heavy rescue squad en route with hydraulic cutters.',
        priority: 'critical',
        type: 'safety'
      });
      nextReplies = ['Passenger door opened safely', 'Still trapped, waiting for rescue'];
    } else if (lower.includes('fire') || lower.includes('smoke') || lower.includes('evacuat')) {
      assistantReply = 'CRITICAL EVACUATION: Smoke / fire escalation! Leave vehicle immediately. Move at least 50 meters upwind behind highway guardrail.';
      localTwin.dialog.activeInstructions.unshift({
        id: 'INST-FIRE',
        title: 'Upwind Fire Barrier Egress',
        description: 'Move 50 meters away from vehicle upwind. Stay behind steel guardrail.',
        priority: 'critical',
        type: 'evacuation'
      });
      nextReplies = ['Clear of vehicle behind barrier', 'Door is jammed / stuck!'];
    } else {
      assistantReply = `Message acknowledged: "${text}". Dispatch coordinator updated.`;
      nextReplies = ['Need immediate medical help', 'I am safe and uninjured', 'Door is jammed / trapped'];
    }

    localTwin.dialog.messages.push({
      id: `AST-${Date.now()}`,
      sender: 'assistant',
      text: assistantReply,
      timestamp: new Date().toISOString(),
      category: 'instruction'
    });
    localTwin.dialog.availableQuickReplies = nextReplies;

    notifyLocalUpdate();
    return { success: true, twin: localTwin, dialog: localTwin.dialog };
  },

  async notifyResponders(vehicleId = 'VEH-ERS-01', summary?: string) {
    try {
      const res = await fetch(`${BASE_URL}/simulations/notify-responders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, summary }),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch {}

    localTwin.workflowState = 'RESPONDER_NOTIFIED';
    notifyLocalUpdate();
    return { success: true };
  },

  async recordHelparrived(vehicleId = 'VEH-ERS-01') {
    try {
      const res = await fetch(`${BASE_URL}/simulations/help-arrived`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId }),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch {}

    localTwin.workflowState = 'HELP_ARRIVED';
    localTwin.status = 'resolved';
    notifyLocalUpdate();
    return { success: true };
  },

  async runScenario(scenarioId: string) {
    try {
      const res = await fetch(`${BASE_URL}/simulations/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch {}

    // Local scenario router
    localTwin.activeScenario = scenarioId;
    if (scenarioId === 'normal_driving') {
      localTwin.status = 'driving';
      localTwin.workflowState = 'SENSING';
    } else if (scenarioId === 'low_impact') {
      this.triggerAccident('low', [], 'safe');
    } else if (scenarioId === 'high_impact') {
      this.triggerAccident('critical', ['smoke'], 'needs_help');
    } else if (scenarioId === 'hazard_after_impact') {
      this.triggerAccident('high', ['smoke', 'fire'], 'needs_help');
    } else if (scenarioId === 'false_alarm') {
      localTwin.workflowState = 'FALSE_ALARM';
      localTwin.status = 'driving';
      localTwin.dialog.messages.push({
        id: `MSG-FA-${Date.now()}`,
        sender: 'assistant',
        text: 'Suspension shock spike detected while stationary / crawling. Are you okay?',
        timestamp: new Date().toISOString(),
        category: 'prompt'
      });
      localTwin.dialog.availableQuickReplies = ['Hit a pothole, all okay', 'False alarm, dismiss alert'];
    }
    notifyLocalUpdate();
    return { success: true, message: `Scenario ${scenarioId} started locally` };
  },

  async sendHardwareTelemetry(payload: any) {
    try {
      const res = await fetch(`${BASE_URL}/hardware/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch {}

    localTwin.latestTelemetry = {
      ...localTwin.latestTelemetry!,
      ...payload,
      source: payload.source || 'hardware',
      timestamp: new Date().toISOString()
    };
    localTwin.dataSourceMode = payload.source || 'hardware';
    notifyLocalUpdate();
    return { success: true, ingested: payload };
  },

  async getIncidents(): Promise<Incident[]> {
    try {
      const res = await fetch(`${BASE_URL}/incidents`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}

    return localIncidents;
  },

  async getIncident(id: string): Promise<Incident> {
    try {
      const res = await fetch(`${BASE_URL}/incidents/${id}`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}

    const inc = localIncidents.find(i => i.incidentId === id);
    if (!inc) throw new Error('Incident not found');
    return inc;
  },

  async closeIncident(id: string, vehicleId = 'VEH-ERS-01', summary?: string) {
    try {
      const res = await fetch(`${BASE_URL}/incidents/${id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, summary }),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch {}

    localTwin.workflowState = 'INCIDENT_CLOSED';
    localTwin.status = 'resolved';
    notifyLocalUpdate();
    return { success: true };
  }
};
