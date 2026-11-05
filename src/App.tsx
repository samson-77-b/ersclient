import React, { useState, useEffect } from 'react';
import { DigitalTwinState, TelemetryData, Incident, DataSourceMode } from './types';
import { api } from './services/api';
import { socket } from './services/socket';
import { Header } from './components/Header';
import { VehicleTwinView } from './components/twin/VehicleTwinView';
import { SensorTelemetryPanel } from './components/telemetry/SensorTelemetryPanel';
import { WorkflowTimeline } from './components/workflow/WorkflowTimeline';
import { AIReasoningPanel } from './components/reasoning/AIReasoningPanel';
import { EmergencyCoordinationPanel } from './components/emergency/EmergencyCoordinationPanel';
import { OccupantInteractiveConsole } from './components/emergency/OccupantInteractiveConsole';
import { SimulationControls } from './components/simulation/SimulationControls';
import { IncidentHistoryModal } from './components/history/IncidentHistoryModal';
import { HardwareSimulatorModal } from './components/hardware/HardwareSimulatorModal';

export const App: React.FC = () => {
  const [twin, setTwin] = useState<DigitalTwinState | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [sourceMode, setSourceMode] = useState<DataSourceMode>('simulation');
  const [isConnected, setIsConnected] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);

  // Initial load
  useEffect(() => {
    api.getTwinState('VEH-ERS-01')
      .then((state) => {
        setTwin(state);
        setSourceMode(state.dataSourceMode);
        if (state.latestTelemetry) {
          setTelemetry(state.latestTelemetry);
        }
        if (state.activeIncidentId) {
          api.getIncident(state.activeIncidentId).then(setActiveIncident).catch(() => {});
        }
      })
      .catch((err) => console.error('Failed to load initial twin state:', err));
  }, []);

  // WebSocket listeners
  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('ers.twin.state.updated', (updatedTwin: DigitalTwinState) => {
      setTwin(updatedTwin);
      setSourceMode(updatedTwin.dataSourceMode);
      if (updatedTwin.latestTelemetry) {
        setTelemetry(updatedTwin.latestTelemetry);
      }
      if (updatedTwin.activeIncidentId) {
        api.getIncident(updatedTwin.activeIncidentId).then(setActiveIncident).catch(() => {});
      } else {
        setActiveIncident(null);
      }
    });

    socket.on('ers.telemetry.updated', (newTelemetry: TelemetryData) => {
      setTelemetry(newTelemetry);
    });

    socket.on('ers.workflow.updated', (evt: any) => {
      if (evt.incidentId) {
        api.getIncident(evt.incidentId).then(setActiveIncident).catch(() => {});
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('ers.twin.state.updated');
      socket.off('ers.telemetry.updated');
      socket.off('ers.workflow.updated');
    };
  }, []);

  // Polling fallback when running on serverless environments (e.g. Vercel) where WebSocket is disconnected
  useEffect(() => {
    if (isConnected) return;
    const interval = setInterval(() => {
      api.getTwinState('VEH-ERS-01')
        .then((state) => {
          setTwin(state);
          setSourceMode(state.dataSourceMode);
          if (state.latestTelemetry) {
            setTelemetry(state.latestTelemetry);
          }
          if (state.activeIncidentId) {
            api.getIncident(state.activeIncidentId).then(setActiveIncident).catch(() => {});
          }
        })
        .catch(() => {});
    }, 1200);
    return () => clearInterval(interval);
  }, [isConnected]);

  if (!twin) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide">Connecting to ERS Digital Twin Core...</p>
      </div>
    );
  }

  const speed = telemetry?.speedKph ?? (twin.status === 'driving' ? 65 : 0);
  const accelerationG = telemetry?.accelerationG ?? 1.0;
  const hazards = twin.reasoning?.hazards || telemetry?.hazardsDetected || [];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <Header
        twin={twin}
        sourceMode={sourceMode}
        onSetMode={(m) => setSourceMode(m)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
        isConnected={isConnected}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
        {/* Section 1: Twin 3D Viewport & Simulation Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 3D Vehicle View (7 cols) */}
          <div className="lg:col-span-7">
            <VehicleTwinView
              status={twin.status}
              workflowState={twin.workflowState}
              speedKph={speed}
              sourceMode={sourceMode}
              hazards={hazards}
              accelerationG={accelerationG}
            />
          </div>

          {/* Simulation Controls (5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <SimulationControls
              twin={twin}
              sourceMode={sourceMode}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
            />
          </div>
        </div>

        {/* Section 2: Workflow Timeline */}
        <WorkflowTimeline
          currentStage={twin.workflowState}
          stages={twin.stages}
        />

        {/* Section 3: In-Cabin Interactive Assistant & Occupant Dialog Console */}
        <OccupantInteractiveConsole twin={twin} />

        {/* Section 4: Sensor Telemetry & AI Reasoning & Emergency Coordination */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Continuous Sensor Telemetry (4 cols) */}
          <div className="lg:col-span-4 flex flex-col">
            <SensorTelemetryPanel telemetry={telemetry} />
          </div>

          {/* AI Reasoning Panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col">
            <AIReasoningPanel reasoning={twin.reasoning} />
          </div>

          {/* Emergency Coordination & Guidance (4 cols) */}
          <div className="lg:col-span-4 flex flex-col">
            <EmergencyCoordinationPanel
              twin={twin}
              activeIncident={activeIncident}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#07090e] px-4 py-3 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>ERS Digital Twin Prototype • AI-Powered Emergency Response Platform</span>
          <span className="font-mono text-[11px] text-slate-400">
            Node.js WebSocket Server • Three.js WebGL Twin • React 18
          </span>
        </div>
      </footer>

      {/* Incident History Drawer / Modal */}
      <IncidentHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Hardware Packet Simulator Modal */}
      <HardwareSimulatorModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        currentMode={sourceMode}
        onSetMode={(m) => setSourceMode(m)}
      />
    </div>
  );
};

export default App;

