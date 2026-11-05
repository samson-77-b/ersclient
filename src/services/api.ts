import { DigitalTwinState, TelemetryData, Incident, SeverityLevel } from '../types';

const BASE_URL = '/api';

export const api = {
  async getTwinState(vehicleId = 'VEH-ERS-01'): Promise<DigitalTwinState> {
    const res = await fetch(`${BASE_URL}/twin/${vehicleId}/state`);
    return res.json();
  },

  async getTelemetryHistory(vehicleId = 'VEH-ERS-01', limit = 40): Promise<TelemetryData[]> {
    const res = await fetch(`${BASE_URL}/twin/${vehicleId}/telemetry?limit=${limit}`);
    return res.json();
  },

  async startSimulation(vehicleId = 'VEH-ERS-01', scenario = 'normal_driving') {
    const res = await fetch(`${BASE_URL}/simulations/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId, scenario })
    });
    return res.json();
  },

  async pauseSimulation() {
    const res = await fetch(`${BASE_URL}/simulations/pause`, { method: 'POST' });
    return res.json();
  },

  async resetSimulation(vehicleId = 'VEH-ERS-01') {
    const res = await fetch(`${BASE_URL}/simulations/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId })
    });
    return res.json();
  },

  async triggerAccident(
    severity: SeverityLevel = 'high',
    hazards: string[] = [],
    occupantResponse: 'safe' | 'needs_help' | 'no_response' = 'needs_help'
  ) {
    const res = await fetch(`${BASE_URL}/simulations/accident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ severity, hazards, occupantResponse })
    });
    return res.json();
  },

  async recordDriverResponse(vehicleId = 'VEH-ERS-01', response: 'safe' | 'needs_help' | 'no_response') {
    const res = await fetch(`${BASE_URL}/simulations/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId, response })
    });
    return res.json();
  },

  async sendOccupantReply(vehicleId = 'VEH-ERS-01', text: string) {
    const res = await fetch(`${BASE_URL}/simulations/dialog/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId, text })
    });
    return res.json();
  },

  async notifyResponders(vehicleId = 'VEH-ERS-01', summary?: string) {
    const res = await fetch(`${BASE_URL}/simulations/notify-responders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId, summary })
    });
    return res.json();
  },

  async recordHelparrived(vehicleId = 'VEH-ERS-01') {
    const res = await fetch(`${BASE_URL}/simulations/help-arrived`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId })
    });
    return res.json();
  },

  async runScenario(scenarioId: string) {
    const res = await fetch(`${BASE_URL}/simulations/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId })
    });
    return res.json();
  },

  async sendHardwareTelemetry(payload: any) {
    const res = await fetch(`${BASE_URL}/hardware/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getIncidents(): Promise<Incident[]> {
    const res = await fetch(`${BASE_URL}/incidents`);
    return res.json();
  },

  async getIncident(id: string): Promise<Incident> {
    const res = await fetch(`${BASE_URL}/incidents/${id}`);
    return res.json();
  },

  async closeIncident(id: string, vehicleId = 'VEH-ERS-01', summary?: string) {
    const res = await fetch(`${BASE_URL}/incidents/${id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId, summary })
    });
    return res.json();
  }
};

