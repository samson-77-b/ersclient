import React from 'react';
import { WorkflowState, StageRecord } from '../../types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  ShieldCheck,
  Radio,
  Brain,
  Megaphone,
  Ambulance,
  FileText,
  Car
} from 'lucide-react';

interface WorkflowTimelineProps {
  currentStage: WorkflowState;
  stages: Record<WorkflowState, StageRecord>;
}

interface StageStep {
  id: WorkflowState;
  label: string;
  subtext: string;
  icon: any;
}

const PRIMARY_STEPS: StageStep[] = [
  { id: 'VEHICLE_RUNNING', label: 'Vehicle Running', subtext: 'Powertrain online', icon: Car },
  { id: 'SENSING', label: 'Continuous Sensing', subtext: 'IMU / GPS / Cabin', icon: Radio },
  { id: 'ACCIDENT_DETECTED', label: 'Accident Detection', subtext: 'Decel & impact trigger', icon: AlertCircle },
  { id: 'AI_REASONING', label: 'AI Reasoning', subtext: 'Severity & hazards', icon: Brain },
  { id: 'SAFETY_DECISION', label: 'Safety Decision', subtext: 'Stay vs Evacuate', icon: ShieldCheck },
  { id: 'OCCUPANT_GUIDANCE', label: 'Occupant Guidance', subtext: 'Audio & visual triage', icon: Megaphone },
  { id: 'EMERGENCY_COORDINATION', label: 'Emergency Data', subtext: 'Enriched PSAP payload', icon: Radio },
  { id: 'RESPONDER_NOTIFIED', label: 'Responders Notified', subtext: 'Dispatch acknowledged', icon: Ambulance },
  { id: 'HELP_ARRIVED', label: 'Help Arrives', subtext: 'On-scene medical/rescue', icon: Ambulance },
  { id: 'INCIDENT_CLOSED', label: 'Incident Report', subtext: 'Logged & archived', icon: FileText }
];

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ currentStage, stages }) => {
  const isBranchActive = currentStage === 'FALSE_ALARM' || currentStage === 'DRIVER_CANCELLED' || currentStage === 'SYSTEM_ERROR';

  return (
    <div className="bg-[#0d1424] border border-slate-800/80 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <PlayCircle className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Interactive Workflow Timeline</h2>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></span> Active Stage
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed
          </span>
        </div>
      </div>

      {/* Alternative branch alert if active */}
      {isBranchActive && (
        <div className="mb-4 p-3 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Branch State Active:</strong> {currentStage === 'FALSE_ALARM' ? 'Sensor spike rejected as False Alarm (Stationary bump)' : currentStage === 'DRIVER_CANCELLED' ? 'Driver reported safe: Emergency dispatch cancelled' : 'System Error encountered'}
            </span>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-900/60 text-amber-300">
            BRANCH TAKEN
          </span>
        </div>
      )}

      {/* Timeline Steps (Horizontal Scrollable on small screens) */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-start min-w-[900px] justify-between relative">
          {/* Connector bar behind nodes */}
          <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-800 z-0" />

          {PRIMARY_STEPS.map((step, idx) => {
            const record = stages[step.id];
            const isActive = currentStage === step.id;
            const isCompleted = record?.status === 'completed';
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center text-center w-24">
                {/* Stage Node Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                    isActive
                      ? 'bg-cyan-500 text-black ring-4 ring-cyan-500/30 scale-110 animate-pulse'
                      : isCompleted
                      ? 'bg-emerald-600 text-white border-2 border-emerald-400'
                      : 'bg-[#111a2e] text-slate-500 border border-slate-700/80'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-4 h-4" />}
                </div>

                {/* Stage Title */}
                <div className="mt-2 text-xs font-semibold leading-tight">
                  <span className={isActive ? 'text-cyan-400 font-bold' : isCompleted ? 'text-slate-200' : 'text-slate-500'}>
                    {step.label}
                  </span>
                </div>

                {/* Subtitle / summary */}
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 max-w-[95px]">
                  {step.subtext}
                </div>

                {/* Status indicator pill */}
                <div className="mt-1.5">
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-medium ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-slate-800/60 text-slate-500'
                    }`}
                  >
                    {isActive ? 'ACTIVE' : isCompleted ? 'DONE' : 'PENDING'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Outcome Summary for Currently Active Stage */}
      {stages[currentStage]?.outcomeSummary && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-cyan-400">Current Phase Output:</span>
            <span className="text-slate-300 font-mono">{stages[currentStage].outcomeSummary}</span>
          </div>
          {stages[currentStage].startedAt && (
            <span className="text-[11px] text-slate-500 font-mono">
              Started: {new Date(stages[currentStage].startedAt!).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

