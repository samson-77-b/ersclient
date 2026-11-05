import React, { useState } from 'react';
import { api } from '../../services/api';
import { X, Cpu, Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { DataSourceMode } from '../../types';

interface HardwareSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: DataSourceMode;
  onSetMode: (mode: DataSourceMode) => void;
}

const DEFAULT_HARDWARE_PAYLOAD = {
  vehicleId: "VEH-ERS-01",
  source: "hardware",
  accelX: 0.12,
  accelY: -0.45,
  accelZ: 1.02,
  accelerationG: 0.47,
  speedKph: 72.4,
  airbagDeployed: false,
  seatbeltFastened: true,
  gps: {
    latitude: 17.385044,
    longitude: 78.486671,
    accuracyMeters: 4.2,
    fix: true
  },
  hazardsDetected: []
};

const CRASH_HARDWARE_PAYLOAD = {
  vehicleId: "VEH-ERS-01",
  source: "hardware",
  accelX: 3.2,
  accelY: 5.8,
  accelZ: 2.1,
  accelerationG: 6.9,
  speedKph: 12.0,
  speedDelta1s: 48.0,
  airbagDeployed: true,
  seatbeltFastened: true,
  gps: {
    latitude: 17.385150,
    longitude: 78.486820,
    accuracyMeters: 3.1,
    fix: true
  },
  hazardsDetected: ["smoke"]
};

export const HardwareSimulatorModal: React.FC<HardwareSimulatorModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSetMode
}) => {
  const [jsonText, setJsonText] = useState(JSON.stringify(DEFAULT_HARDWARE_PAYLOAD, null, 2));
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    setSending(true);
    setResultMsg(null);
    try {
      const parsed = JSON.parse(jsonText);
      const res = await api.sendHardwareTelemetry(parsed);
      setResultMsg({
        type: 'success',
        text: `Hardware packet ingested! Source tagged as [${res.ingested.source.toUpperCase()}]. Incident created: ${res.incidentCreated ? 'YES' : 'NO'}`
      });
      if (parsed.source) {
        onSetMode(parsed.source);
      }
    } catch (err: any) {
      setResultMsg({ type: 'error', text: `Failed: ${err.message}` });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0d1424] border border-slate-800 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-slate-100 text-base">Hardware & Hybrid Mode Interface</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-4 bg-[#090d18] border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-300 font-semibold">Active Ingestion Source Mode:</span>
          <div className="flex space-x-1.5 font-mono">
            {(['simulation', 'hardware', 'hybrid'] as DataSourceMode[]).map((m) => (
              <button
                key={m}
                onClick={() => onSetMode(m)}
                className={`px-3 py-1 rounded uppercase font-bold text-[11px] border transition ${
                  currentMode === m
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Hardware Telemetry JSON Payload:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setJsonText(JSON.stringify(DEFAULT_HARDWARE_PAYLOAD, null, 2))}
                className="text-cyan-400 hover:underline text-[11px]"
              >
                Normal Preset
              </button>
              <span>•</span>
              <button
                onClick={() => setJsonText(JSON.stringify(CRASH_HARDWARE_PAYLOAD, null, 2))}
                className="text-red-400 hover:underline text-[11px]"
              >
                Crash Preset
              </button>
            </div>
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={10}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
          />

          {resultMsg && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                resultMsg.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/60 border border-red-500/50 text-red-300'
              }`}
            >
              {resultMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{resultMsg.text}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Close
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? 'Ingesting...' : 'Ingest Payload to Twin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

