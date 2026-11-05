import React, { useState } from 'react';
import { DigitalTwinState, SeverityLevel, DataSourceMode } from '../../types';
import { api } from '../../services/api';
import {
  Play,
  Pause,
  RotateCcw,
  AlertOctagon,
  Flame,
  CheckCircle,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

interface SimulationControlsProps {
  twin: DigitalTwinState;
  sourceMode: DataSourceMode;
  onOpenHistory: () => void;
  onOpenHardwareModal: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  twin,
  sourceMode,
  onOpenHistory,
  onOpenHardwareModal
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel>('high');
  const [selectedHazards, setSelectedHazards] = useState<string[]>(['smoke']);
  const [selectedOccupantResp, setSelectedOccupantResp] = useState<'safe' | 'needs_help' | 'no_response'>('needs_help');

  const isHardwareMode = sourceMode === 'hardware';

  const toggleHazard = (hazard: string) => {
    setSelectedHazards((prev) =>
      prev.includes(hazard) ? prev.filter((h) => h !== hazard) : [...prev, hazard]
    );
  };

  const handleTriggerAccident = () => {
    api.triggerAccident(selectedSeverity, selectedHazards, selectedOccupantResp);
  };

  return (
    <div className="bg-[#0d1424] border border-slate-800/80 rounded-xl p-4 shadow-xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Digital Twin Simulation Controls</h2>
        </div>
        <div className="flex items-center space-x-2">
          {isHardwareMode ? (
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-300 font-bold">
              Hardware Mode (Sim Controls Locked)
            </span>
          ) : (
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
              Simulation Engine Online
            </span>
          )}
        </div>
      </div>

      {/* Main Simulation Lifecycle Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => api.startSimulation(twin.vehicleId, 'normal_driving')}
          disabled={isHardwareMode}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Start Vehicle
        </button>

        <button
          onClick={() => api.pauseSimulation()}
          disabled={isHardwareMode}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Pause className="w-3.5 h-3.5" />
          Pause / Resume
        </button>

        <button
          onClick={() => api.resetSimulation(twin.vehicleId)}
          disabled={isHardwareMode}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Twin
        </button>

        <button
          onClick={onOpenHistory}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-cyan-800/50 transition"
        >
          <Layers className="w-3.5 h-3.5" />
          Incident History
        </button>
      </div>

      {/* Repeatable Scenarios Presets (Section 15) */}
      <div className="bg-[#111a2e] border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">Preset Scenarios (Section 15):</span>
          <span className="text-[10px] text-slate-500">8 Validated Tests</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
          {[
            { id: 'normal_driving', label: '1. Normal Driving' },
            { id: 'low_impact', label: '2. Low Impact' },
            { id: 'high_impact', label: '3. High Impact' },
            { id: 'false_alarm', label: '4. False Alarm' },
            { id: 'hazard_after_impact', label: '5. Post-Impact Fire' },
            { id: 'sensor_unavailable', label: '6. Sensor Degraded' },
            { id: 'responder_delay', label: '7. Responder Delay' },
            { id: 'network_loss', label: '8. Network Loss' }
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => api.runScenario(sc.id)}
              disabled={isHardwareMode}
              className={`p-1.5 rounded text-[11px] font-medium border text-left transition truncate ${
                twin.activeScenario === sc.id
                  ? 'bg-cyan-950 border-cyan-500/60 text-cyan-300 font-bold'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Crash Trigger Configuration Box */}
      <div className="bg-[#111a2e] border border-slate-800 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            Simulate Custom Accident Event:
          </span>
          <span className="text-[10px] text-slate-400">Section 3.F</span>
        </div>

        {/* Severity selection */}
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Impact Severity:</label>
          <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
            {(['low', 'moderate', 'high', 'critical'] as SeverityLevel[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedSeverity(lvl)}
                disabled={isHardwareMode}
                className={`py-1 rounded uppercase font-semibold text-[10px] border transition ${
                  selectedSeverity === lvl
                    ? 'bg-red-950 border-red-500 text-red-300 ring-1 ring-red-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Hazards selection */}
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Simulated Secondary Hazards:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-mono">
            {['smoke', 'fire', 'fuel_leak', 'vehicle_instability'].map((haz) => (
              <button
                key={haz}
                onClick={() => toggleHazard(haz)}
                disabled={isHardwareMode}
                className={`py-1 px-1.5 rounded uppercase font-semibold text-[10px] border text-center transition truncate ${
                  selectedHazards.includes(haz)
                    ? 'bg-amber-950 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {haz.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Big Trigger Accident Action Button */}
        <button
          onClick={handleTriggerAccident}
          disabled={isHardwareMode}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <AlertOctagon className="w-4 h-4 fill-current" />
          🚨 Trigger Simulated Accident
        </button>
      </div>

      {/* Hardware Telemetry Test Injection Button */}
      <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
        <span>Hardware Integration (Section 1):</span>
        <button
          onClick={onOpenHardwareModal}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          Hardware Packet Simulator
        </button>
      </div>
    </div>
  );
};

