import { DigitalTwinState } from '../types';

export const DEFAULT_INITIAL_TWIN: DigitalTwinState = {
  vehicleId: 'VEH-ERS-01',
  status: 'driving',
  workflowState: 'SENSING',
  dataSourceMode: 'simulation',
  stages: {
    IDLE: { stage: 'IDLE', status: 'completed', outcomeSummary: 'Powertrain verified' },
    VEHICLE_RUNNING: { stage: 'VEHICLE_RUNNING', status: 'completed', outcomeSummary: 'Vehicle in operation' },
    SENSING: { stage: 'SENSING', status: 'active', startedAt: new Date().toISOString(), outcomeSummary: 'Continuous IMU, GPS, and cabin sensing online' },
    ACCIDENT_DETECTED: { stage: 'ACCIDENT_DETECTED', status: 'pending' },
    AI_REASONING: { stage: 'AI_REASONING', status: 'pending' },
    SAFETY_DECISION: { stage: 'SAFETY_DECISION', status: 'pending' },
    OCCUPANT_GUIDANCE: { stage: 'OCCUPANT_GUIDANCE', status: 'pending' },
    EMERGENCY_COORDINATION: { stage: 'EMERGENCY_COORDINATION', status: 'pending' },
    RESPONDER_NOTIFIED: { stage: 'RESPONDER_NOTIFIED', status: 'pending' },
    HELP_ARRIVED: { stage: 'HELP_ARRIVED', status: 'pending' },
    INCIDENT_CLOSED: { stage: 'INCIDENT_CLOSED', status: 'pending' },
    FALSE_ALARM: { stage: 'FALSE_ALARM', status: 'pending' },
    DRIVER_CANCELLED: { stage: 'DRIVER_CANCELLED', status: 'pending' },
    SYSTEM_ERROR: { stage: 'SYSTEM_ERROR', status: 'pending' }
  },
  activeIncidentId: null,
  latestTelemetry: {
    timestamp: new Date().toISOString(),
    vehicleId: 'VEH-ERS-01',
    source: 'simulation',
    accelerationG: 0.95,
    accelAxes: { x: 0.02, y: 0.04, z: 0.99 },
    speedKph: 68.0,
    speedDelta1s: 0,
    airbagDeployed: false,
    seatbeltFastened: true,
    gps: {
      latitude: 17.385044,
      longitude: 78.486671,
      speed: 68.0,
      fix: true,
      accuracyMeters: 3.2
    },
    cameraStatus: 'synthetic',
    micStatus: 'synthetic',
    occupantMonitoring: {
      detectedCount: 1,
      responsive: true,
      confidence: 0.94,
      status: 'responsive'
    },
    hazardsDetected: [],
    sensorHealth: {
      imu: 'healthy',
      gps: 'healthy',
      camera: 'healthy',
      canBus: 'healthy'
    }
  },
  reasoning: null,
  dialog: {
    triageStep: 'IDLE',
    messages: [
      {
        id: 'MSG-INIT',
        sender: 'assistant',
        text: 'Emergency Response System active. Continuous sensing online at 68 km/h. Ready for scenario simulation.',
        timestamp: new Date().toISOString(),
        category: 'prompt'
      }
    ],
    availableQuickReplies: [
      'Trigger High Impact Crash',
      'Trigger Post-Impact Fire',
      'Trigger False Alarm'
    ],
    reportedInjuries: [],
    reportedHazards: [],
    canMoveSafely: true,
    needsImmediateRescue: false,
    activeInstructions: [
      {
        id: 'INST-INIT',
        title: 'Continuous Sensing Active',
        description: 'Seatbelts fastened, powertrain nominal. Tri-axial accelerometers and GNSS active.',
        priority: 'normal',
        type: 'safety'
      }
    ]
  },
  lastUpdated: new Date().toISOString(),
  isSimulating: true,
  activeScenario: 'normal_driving'
};
