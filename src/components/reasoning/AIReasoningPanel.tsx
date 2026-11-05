import React from 'react';
import { ReasoningResult } from '../../types';
import { Brain, Flame, AlertTriangle, ShieldAlert, Check, HelpCircle, Info } from 'lucide-react';

interface AIReasoningPanelProps {
  reasoning: ReasoningResult | null;
}

export const AIReasoningPanel: React.FC<AIReasoningPanelProps> = ({ reasoning }) => {
  if (!reasoning) {
    return (
      <div className="bg-[#0d1424] border border-slate-800/80 rounded-xl p-4 shadow-xl flex flex-col justify-center items-center text-center text-slate-500 py-10">
        <Brain className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
        <p className="text-sm">AI Reasoning Engine Standby</p>
        <p className="text-xs text-slate-600 mt-1">Evaluates severity, hazards & occupant state upon impact detection</p>
      </div>
    );
  }

  const { severity, hazards, occupantStatus, recommendedAction, guidance, confidence, evidence, isSimulation } = reasoning;

  // Severity style
  const getSeverityBadge = () => {
    switch (severity) {
      case 'critical':
        return { text: 'CRITICAL SEVERITY', bg: 'bg-red-500/20 text-red-400 border-red-500/50' };
      case 'high':
        return { text: 'HIGH SEVERITY', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/50' };
      case 'moderate':
        return { text: 'MODERATE SEVERITY', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/50' };
      case 'low':
        return { text: 'LOW SEVERITY', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/50' };
      default:
        return { text: 'NONE / MINIMAL', bg: 'bg-slate-700/30 text-slate-400 border-slate-700' };
    }
  };

  const sevBadge = getSeverityBadge();

  return (
    <div className="bg-[#0d1424] border border-slate-800/80 rounded-xl p-4 shadow-xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase">AI Reasoning & Decision Engine</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded border ${sevBadge.bg}`}>
            {sevBadge.text}
          </span>
          <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
            Confidence: {(confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Safety Decision Hero Callout */}
      <div
        className={`p-3.5 rounded-lg border flex items-start space-x-3 shadow-inner ${
          recommendedAction === 'evacuate_if_safe'
            ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
            : 'bg-blue-950/40 border-blue-500/60 text-blue-200'
        }`}
      >
        <div className="p-2 rounded-md bg-black/30 flex-shrink-0 mt-0.5">
          {recommendedAction === 'evacuate_if_safe' ? (
            <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-blue-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm tracking-wide">
              DECISION: {recommendedAction === 'evacuate_if_safe' ? 'EVACUATE IF SAFE' : 'STAY INSIDE VEHICLE'}
            </h3>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-black/40 rounded">
              Rule-Backed
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            {recommendedAction === 'evacuate_if_safe'
              ? 'Active smoke/fire risk or rollover hazard detected. Safely unbuckle and exit away from moving traffic.'
              : 'No immediate thermal hazard detected. Cabin structure intact; remain restrained to avoid secondary impact.'}
          </p>
        </div>
      </div>

      {/* Secondary Metrics: Hazards & Occupants */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Hazards */}
        <div className="bg-[#111a2e] p-3 rounded-lg border border-slate-800/90">
          <span className="text-slate-400 block font-semibold mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Detected Hazards:
          </span>
          {hazards.length === 0 ? (
            <span className="text-slate-400 italic font-mono text-[11px]">No active thermal or fuel hazards</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {hazards.map((h) => (
                <span
                  key={h}
                  className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-300 uppercase font-mono font-bold text-[10px]"
                >
                  ⚠️ {h.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Occupant Monitoring */}
        <div className="bg-[#111a2e] p-3 rounded-lg border border-slate-800/90">
          <span className="text-slate-400 block font-semibold mb-1.5 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            Occupant Triage State:
          </span>
          <div className="flex items-center justify-between">
            <span
              className={`font-mono font-bold uppercase text-xs px-2 py-0.5 rounded ${
                occupantStatus === 'responsive'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : occupantStatus === 'unresponsive'
                  ? 'bg-red-950 text-red-300 border border-red-500/50 animate-pulse'
                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
              }`}
            >
              {occupantStatus}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">OMS Model v2.4</span>
          </div>
        </div>
      </div>

      {/* Evidence & Telemetry Triggers */}
      <div className="bg-[#111a2e] p-3 rounded-lg border border-slate-800/90 text-xs">
        <span className="text-slate-400 font-semibold block mb-1">Supporting Evidence:</span>
        <ul className="space-y-1">
          {evidence.map((ev, i) => (
            <li key={i} className="text-slate-300 text-[11px] flex items-center gap-1.5">
              <span className="text-cyan-400">•</span>
              {ev}
            </li>
          ))}
        </ul>
      </div>

      {/* Disclaimer as required by Section 3.D */}
      <div className="text-[10px] text-slate-500 flex items-start gap-1.5 bg-slate-900/60 p-2 rounded border border-slate-800/60">
        <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Decision Support Notice:</strong> AI output provides decision assistance, not a guaranteed safety assessment. Sensor uncertainty is accounted for; never present unverified states as medical diagnosis.
        </span>
      </div>
    </div>
  );
};

