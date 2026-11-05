export type DataSourceMode = 'simulation' | 'hardware' | 'hybrid';

export type WorkflowState =
  | 'IDLE'
  | 'VEHICLE_RUNNING'
  | 'SENSING'
  | 'ACCIDENT_DETECTED'
  | 'AI_REASONING'
  | 'SAFETY_DECISION'
  | 'OCCUPANT_GUIDANCE'
  | 'EMERGENCY_COORDINATION'
  | 'RESPONDER_NOTIFIED'
  | 'HELP_ARRIVED'
  | 'INCIDENT_CLOSED'
  | 'FALSE_ALARM'
  | 'DRIVER_CANCELLED'
  | 'SYSTEM_ERROR';

export type StageStatus = 'pending' | 'active' | 'completed' | 'skipped' | 'failed';
export type SeverityLevel = 'none' | 'low' | 'moderate' | 'high' | 'critical';
export type OccupantStatus = 'unknown' | 'responsive' | 'unresponsive' | 'needs_assistance';
export type SafetyAction = 'stay_inside' | 'evacuate_if_safe';

export type VehicleTwinStatus =
  | 'idle'
  | 'driving'
  | 'impact_detected'
  | 'hazard_detected'
  | 'emergency_active'
  | 'resolved';

export interface TelemetryData {
  timestamp: string;
  vehicleId: string;
  source: DataSourceMode;
  accelerationG: number;
  accelAxes: { x: number; y: number; z: number };
  speedKph: number;
  speedDelta1s?: number;
  airbagDeployed: boolean | null;
  seatbeltFastened: boolean | null;
  gps: {
    latitude: number;
    longitude: number;
    speed: number;
    fix: boolean;
    accuracyMeters: number;
  };
  cameraStatus: 'active' | 'synthetic' | 'offline';
  micStatus: 'active' | 'synthetic' | 'offline';
  occupantMonitoring: {
    detectedCount: number;
    responsive: boolean;
    confidence: number;
    status: OccupantStatus;
  };
  hazardsDetected: string[];
  sensorHealth: {
    imu: 'healthy' | 'degraded' | 'stale';
    gps: 'healthy' | 'degraded' | 'stale';
    camera: 'healthy' | 'degraded' | 'stale' | 'offline';
    canBus: 'healthy' | 'degraded' | 'stale';
  };
}

export interface ReasoningResult {
  severity: SeverityLevel;
  hazards: string[];
  occupantStatus: OccupantStatus;
  recommendedAction: SafetyAction;
  guidance: string[];
  confidence: number;
  evidence: string[];
  isSimulation: boolean;
  timestamp: string;
  ruleVersion: string;
}

export interface IncidentEvent {
  id: string;
  incidentId: string;
  type: string;
  stage: WorkflowState;
  timestamp: string;
  description: string;
  payload?: any;
}

export interface EnrichedEmergencyData {
  incidentId: string;
  vehicleId: string;
  occurredAt: string;
  source: DataSourceMode;
  location: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    addressDescription?: string;
  };
  severity: SeverityLevel;
  hazards: string[];
  occupantStatus: OccupantStatus;
  occupantCount: number;
  driverResponse: 'pending' | 'safe' | 'needs_help' | 'unresponsive' | 'cancelled';
  responderStatus: 'not_notified' | 'notified' | 'en_route' | 'arrived';
  helpArrivalStatus: 'pending' | 'arrived';
  status: 'open' | 'closed' | 'false_alarm';
  guidanceSent: string[];
  estimatedArrivalTime?: string;
  assignedUnit?: string;
}

export interface Incident {
  incidentId: string;
  vehicleId: string;
  occurredAt: string;
  closedAt?: string;
  source: DataSourceMode;
  idempotencyKey?: string;
  enrichedData: EnrichedEmergencyData;
  events: IncidentEvent[];
  reasoning?: ReasoningResult;
}

export interface StageRecord {
  stage: WorkflowState;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  outcomeSummary?: string;
}

export type TriageStep =
  | 'IDLE'
  | 'RESPONSIVENESS'
  | 'INJURIES'
  | 'MOBILITY'
  | 'HAZARDS'
  | 'ACTION_GUIDANCE'
  | 'COMPLETED';

export interface DialogMessage {
  id: string;
  sender: 'assistant' | 'occupant';
  text: string;
  timestamp: string;
  category?: 'prompt' | 'injury' | 'hazard' | 'instruction' | 'first_aid';
}

export interface ActiveInstructionItem {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'normal';
  type: 'safety' | 'first_aid' | 'evacuation';
}

export interface OccupantInteractionState {
  triageStep: TriageStep;
  messages: DialogMessage[];
  availableQuickReplies: string[];
  reportedInjuries: string[];
  reportedHazards: string[];
  canMoveSafely: boolean | null;
  needsImmediateRescue: boolean;
  activeInstructions: ActiveInstructionItem[];
}

export interface DigitalTwinState {
  vehicleId: string;
  status: VehicleTwinStatus;
  workflowState: WorkflowState;
  dataSourceMode: DataSourceMode;
  stages: Record<WorkflowState, StageRecord>;
  activeIncidentId: string | null;
  latestTelemetry: TelemetryData | null;
  reasoning: ReasoningResult | null;
  dialog: OccupantInteractionState;
  lastUpdated: string;
  isSimulating: boolean;
  activeScenario?: string;
}

