import React from 'react';
import { DigitalTwinState, DataSourceMode } from '../types';
import { ShieldAlert, Radio, Activity, Cpu, Layers } from 'lucide-react';

interface HeaderProps {
  twin: DigitalTwinState;
  sourceMode: DataSourceMode;
  onSetMode: (mode: DataSourceMode) => void;
  onOpenHistory: () => void;
  onOpenHardwareModal: () => void;
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  twin,
  sourceMode,
  onSetMode,
  onOpenHistory,
  onOpenHardwareModal,
  isConnected
}) => {
  return (
    <header className="bg-[#0b101d]/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">ERS Digital Twin</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase font-mono">
                Studio v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400">AI-Powered In-Vehicle Emergency Response Twin</p>
          </div>
        </div>

        {/* Center / Vehicle Info & Mode Selector */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Vehicle Identifier */}
          <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 font-mono text-xs flex items-center space-x-1.5">
            <span className="text-slate-500 text-[10px]">VEHICLE:</span>
            <span className="font-bold text-white">{twin.vehicleId}</span>
          </div>

          {/* Mode Switcher Pill */}
          <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex items-center space-x-1 font-mono text-[11px]">
            {(['simulation', 'hardware', 'hybrid'] as DataSourceMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onSetMode(mode)}
                className={`px-2.5 py-1 rounded font-bold uppercase transition ${
                  sourceMode === mode
                    ? mode === 'simulation'
                      ? 'bg-cyan-600 text-white shadow'
                      : mode === 'hardware'
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Right Status Indicators & Action Buttons */}
        <div className="flex items-center space-x-2 text-xs">
          {/* WebSocket Live Status */}
          <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[11px] font-mono text-slate-300">{isConnected ? 'LIVE WS' : 'OFFLINE'}</span>
          </div>

          {/* Quick Hardware Simulator */}
          <button
            onClick={onOpenHardwareModal}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Open Hardware Packet Tester"
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Incident History Drawer */}
          <button
            onClick={onOpenHistory}
            className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            Incidents
          </button>
        </div>
      </div>
    </header>
  );
};

