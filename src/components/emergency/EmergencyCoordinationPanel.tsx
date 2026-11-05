import React, { useState, useEffect } from 'react';
import { DigitalTwinState, Incident } from '../../types';
import { api } from '../../services/api';
import {
  Ambulance,
  PhoneCall,
  Volume2,
  VolumeX,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Send,
  CheckCircle,
  FileCode
} from 'lucide-react';

interface EmergencyCoordinationPanelProps {
  twin: DigitalTwinState;
  activeIncident: Incident | null;
}

export const EmergencyCoordinationPanel: React.FC<EmergencyCoordinationPanelProps> = ({
  twin,
  activeIncident
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showJsonPayload, setShowJsonPayload] = useState(false);

  const enriched = activeIncident?.enrichedData;
  const isEmergencyActive = ['ACCIDENT_DETECTED', 'AI_REASONING', 'SAFETY_DECISION', 'OCCUPANT_GUIDANCE', 'EMERGENCY_COORDINATION', 'RESPONDER_NOTIFIED', 'HELP_ARRIVED'].includes(twin.workflowState);

  // Countdown timer for driver response
  useEffect(() => {
    if (twin.workflowState === 'OCCUPANT_GUIDANCE' && countdown === null) {
      setCountdown(15);
    } else if (twin.workflowState === 'IDLE' || twin.workflowState === 'INCIDENT_CLOSED') {
      setCountdown(null);
    }
  }, [twin.workflowState]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c === 1) {
          // Timeout reached: trigger no response
          api.recordDriverResponse(twin.vehicleId, 'no_response');
          return 0;
        }
        return c !== null ? c - 1 : null;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown, twin.vehicleId]);

  // Web Speech API Voice synthesis for voice guidance to occupants (Section 8)
  const speakGuidance = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const messages = twin.reasoning?.guidance || [
      'An impact event was detected. Are you able to respond?',
      'Check for immediate danger. Emergency coordination is active.'
    ];

    const utterance = new SpeechSynthesisUtterance(messages.join('. '));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  if (!isEmergencyActive && !activeIncident) {
    return (
      <div className="bg-[#0d1424] border border-slate-800/80 rounded-xl p-4 shadow-xl flex flex-col justify-center items-center text-center text-slate-500 py-10">
        <Ambulance className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-sm">Emergency Coordination Standby</p>
        <p className="text-xs text-slate-600 mt-1">PSAP dispatch payload & guidance activates upon accident detection</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1424] border border-slate-800/80 rounded-xl p-4 shadow-xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Ambulance className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Emergency Coordination & PSAP Gateway</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded">
            ID: {activeIncident?.incidentId || 'INC-PENDING'}
          </span>
          <button
            onClick={() => setShowJsonPayload(!showJsonPayload)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition"
            title="Inspect Enriched JSON"
          >
            <FileCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Driver Response Interactive Prompt (Section 8) */}
      <div className="bg-[#111a2e] border border-slate-800 rounded-lg p-3.5 flex flex-col space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-cyan-400" />
            Occupant In-Cabin Response Flow:
          </span>
          {countdown !== null && countdown > 0 && (
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 rounded animate-pulse">
              ⏱️ Auto-escalating in: {countdown}s
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Status: <strong className="uppercase text-slate-200">{enriched?.driverResponse || 'Awaiting response'}</strong>
        </p>

        {/* Buttons for driver response */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => {
              setCountdown(null);
              api.recordDriverResponse(twin.vehicleId, 'safe');
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            "I Am Safe"
          </button>

          <button
            onClick={() => {
              setCountdown(null);
              api.recordDriverResponse(twin.vehicleId, 'needs_help');
            }}
            className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/50 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            "Need Help"
          </button>

          <button
            onClick={() => {
              setCountdown(0);
              api.recordDriverResponse(twin.vehicleId, 'no_response');
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition col-span-2 sm:col-span-1"
          >
            Simulate Timeout
          </button>
        </div>
      </div>

      {/* Voice Guidance to Occupants (Section 8) */}
      <div className="bg-[#111a2e] border border-slate-800 rounded-lg p-3 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            Voice & Visual Safety Guidance
          </span>
          <button
            onClick={speakGuidance}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition flex items-center gap-1 ${
              isSpeaking
                ? 'bg-cyan-500 text-black border-cyan-400 animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            {isSpeaking ? 'Stop Speaking' : 'Play Cabin Voice (TTS)'}
          </button>
        </div>

        <div className="space-y-1.5 text-slate-300 font-mono text-[11px] bg-slate-950/60 p-2.5 rounded border border-slate-900">
          {(twin.reasoning?.guidance || [
            '1. An impact event was detected. Confirm your status.',
            '2. Check whether it is safe to move.',
            '3. If fire or smoke occurs, evacuate at once.'
          ]).map((msg, i) => (
            <p key={i} className="flex items-start gap-1.5">
              <span className="text-cyan-400">›</span>
              {msg}
            </p>
          ))}
        </div>
      </div>

      {/* Emergency Responder Dispatch Progress */}
      <div className="bg-[#111a2e] border border-slate-800 rounded-lg p-3 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Ambulance className="w-4 h-4 text-cyan-400" />
            Dispatch & First Responder Status
          </span>
          <span
            className={`font-mono uppercase text-[10px] font-bold px-2 py-0.5 rounded ${
              enriched?.responderStatus === 'arrived'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                : enriched?.responderStatus === 'notified'
                ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {enriched?.responderStatus || 'STANDBY'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
          <div>
            <span>Assigned Units:</span>
            <p className="font-bold text-slate-200">{enriched?.assignedUnit || 'Local EMS / Highway Patrol'}</p>
          </div>
          <div>
            <span>Estimated Arrival:</span>
            <p className="font-bold text-cyan-400">{enriched?.estimatedArrivalTime || 'En Route (ETA 4m)'}</p>
          </div>
        </div>

        {/* Quick simulation buttons for responder actions */}
        <div className="flex gap-2 mt-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => api.notifyResponders(twin.vehicleId)}
            className="flex-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-[11px] transition"
          >
            Simulate Responders Notified
          </button>
          <button
            onClick={() => api.recordHelparrived(twin.vehicleId)}
            className="flex-1 px-2.5 py-1 rounded bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 font-semibold text-[11px] transition"
          >
            Simulate Help Arrived
          </button>
        </div>
      </div>

      {/* JSON Payload Inspection Drawer */}
      {showJsonPayload && enriched && (
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-48">
          <div className="text-[10px] text-slate-500 mb-1">// Enriched Emergency PSAP Payload (Section 9)</div>
          <pre>{JSON.stringify(enriched, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

