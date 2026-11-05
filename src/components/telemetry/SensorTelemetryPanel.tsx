import React from 'react';
import { TelemetryData } from '../../types';
import {
  Activity,
  Compass,
  Gauge,
  Shield,
  Video,
  Mic,
  Users,
  CheckCircle2,
  AlertCircle,
  Radio
} from 'lucide-react';

interface SensorTelemetryPanelProps {
  telemetry: TelemetryData | null;
}

export const SensorTelemetryPanel: React.FC<SensorTelemetryPanelProps> = ({ telemetry }) => {
  if (!telemetry) {
    return (
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-5 text-slate-400 text-sm flex items-center justify-center min-h-[300px]">
        <Activity className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
        Awaiting telemetry data stream...
      </div>
    );
  }

  const { accelAxes, accelerationG, speedKph, gps, airbagDeployed, seatbeltFastened, occupantMonitoring, sensorHealth, source } = telemetry;
  const resultantG = accelerationG || Math.hypot(accelAxes.x, accelAxes.y, accelAxes.z);

  // Safety threshold color for IMU G-force
  const getGColor = (g: number) => {
    if (g >= 4.0) return 'text-red-400 border-red-500/40 bg-red-950/30';
    if (g >= 2.5) return 'text-amber-400 border-amber-500/40 bg-amber-950/30';
    return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30';
  };

  return (
    <div className="bg-[#0d1424] border border-slate-800/80 rounded-xl p-4 shadow-xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Continuous Sensor Telemetry</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">
            Source: {source}
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
        </div>
      </div>

      {/* Grid of Sensor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* 1. IMU 6-DOF / Accelerometer */}
        <div className="bg-[#111a2e] border border-slate-800/90 rounded-lg p-3 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              IMU Accelerometer
            </span>
            <span className="text-[10px] text-slate-500">±16G MEMS</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <div className={`px-2 py-0.5 rounded border font-mono font-bold text-sm ${getGColor(resultantG)}`}>
              {resultantG.toFixed(2)} G
            </div>
            <span className="text-[11px] text-slate-400">Resultant Load</span>
          </div>

          {/* 3-axis meter */}
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between items-center text-slate-400">
              <span>X (lat):</span>
              <span className="text-slate-200 font-semibold">{accelAxes.x >= 0 ? `+${accelAxes.x.toFixed(2)}` : accelAxes.x.toFixed(2)} G</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Y (long):</span>
              <span className="text-slate-200 font-semibold">{accelAxes.y >= 0 ? `+${accelAxes.y.toFixed(2)}` : accelAxes.y.toFixed(2)} G</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Z (vert):</span>
              <span className="text-slate-200 font-semibold">{accelAxes.z >= 0 ? `+${accelAxes.z.toFixed(2)}` : accelAxes.z.toFixed(2)} G</span>
            </div>
          </div>
        </div>

        {/* 2. GPS & Velocity */}
        <div className="bg-[#111a2e] border border-slate-800/90 rounded-lg p-3 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              GNSS / GPS Receiver
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${gps.fix ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'}`}>
              {gps.fix ? '3D FIX' : 'NO FIX'}
            </span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="font-mono font-bold text-cyan-400 text-lg">
              {speedKph.toFixed(0)} <span className="text-xs text-slate-400 font-normal">km/h</span>
            </div>
            <span className="text-[11px] text-slate-400">Accuracy: ±{gps.accuracyMeters}m</span>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Lat:</span>
              <span className="text-slate-200">{gps.latitude.toFixed(6)}°</span>
            </div>
            <div className="flex justify-between">
              <span>Lng:</span>
              <span className="text-slate-200">{gps.longitude.toFixed(6)}°</span>
            </div>
          </div>
        </div>

        {/* 3. Airbag & Seatbelt Status */}
        <div className="bg-[#111a2e] border border-slate-800/90 rounded-lg p-3 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              Restraints & Airbag
            </span>
            <span className="text-[10px] text-slate-500">CAN-Bus</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/70">
            <span className="text-xs text-slate-300">Airbag Status:</span>
            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${airbagDeployed ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {airbagDeployed ? '💥 DEPLOYED' : 'ARMED / OK'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-slate-300">Driver Seatbelt:</span>
            <span className={`text-xs font-semibold ${seatbeltFastened ? 'text-emerald-400' : 'text-amber-400'}`}>
              {seatbeltFastened ? '✓ FASTENED' : '⚠️ UNFASTENED'}
            </span>
          </div>
        </div>

        {/* 4. Cabin Visual & Occupant Monitoring */}
        <div className="bg-[#111a2e] border border-slate-800/90 rounded-lg p-3 hover:border-slate-700 transition sm:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Cabin Occupant Monitoring System (OMS)
            </span>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Video className="w-3 h-3 text-cyan-400" />
                {telemetry.cameraStatus}
              </span>
              <span className="flex items-center gap-1">
                <Mic className="w-3 h-3 text-cyan-400" />
                {telemetry.micStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
            <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
              <span className="text-slate-500 text-[10px] block">Occupants</span>
              <span className="font-bold text-slate-200">{occupantMonitoring.detectedCount} Person(s)</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
              <span className="text-slate-500 text-[10px] block">State</span>
              <span className={`font-bold uppercase ${occupantMonitoring.responsive ? 'text-emerald-400' : 'text-red-400'}`}>
                {occupantMonitoring.status || (occupantMonitoring.responsive ? 'Responsive' : 'Unresponsive')}
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
              <span className="text-slate-500 text-[10px] block">AI Confidence</span>
              <span className="font-bold text-cyan-400">{(occupantMonitoring.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* 5. Subsystem Health Matrix */}
        <div className="bg-[#111a2e] border border-slate-800/90 rounded-lg p-3 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Hardware Health
            </span>
            <span className="text-[10px] text-slate-500">Diagnostic</span>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
            <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-1 rounded">
              <span className="text-slate-400">IMU</span>
              <span className="text-emerald-400">OK</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-1 rounded">
              <span className="text-slate-400">GPS</span>
              <span className={sensorHealth.gps === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}>
                {sensorHealth.gps === 'healthy' ? 'OK' : 'DEGRADED'}
              </span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-1 rounded">
              <span className="text-slate-400">CAM</span>
              <span className="text-cyan-400">SYNTH</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-1 rounded">
              <span className="text-slate-400">CAN</span>
              <span className="text-emerald-400">OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

