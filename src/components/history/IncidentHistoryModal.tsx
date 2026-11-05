import React, { useState, useEffect } from 'react';
import { Incident } from '../../types';
import { api } from '../../services/api';
import {
  X,
  FileText,
  Download,
  Calendar,
  Clock,
  Shield,
  AlertTriangle,
  Printer,
  ChevronRight
} from 'lucide-react';

interface IncidentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IncidentHistoryModal: React.FC<IncidentHistoryModalProps> = ({ isOpen, onClose }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.getIncidents()
      .then((data) => {
        setIncidents(data);
        if (data.length > 0 && !selectedIncident) {
          setSelectedIncident(data[0]);
        }
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportJson = (incidentId: string) => {
    window.open(`/api/incidents/${incidentId}/report?format=json`, '_blank');
  };

  const handleExportCsv = (incidentId: string) => {
    window.open(`/api/incidents/${incidentId}/report?format=csv`, '_blank');
  };

  const handlePrintReport = (incidentId: string) => {
    window.open(`/api/incidents/${incidentId}/report?format=html`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0d1424] border border-slate-800 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-slate-100 text-base">Incident History & Audit Archive</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content split pane */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Incident List */}
          <div className="w-full md:w-80 border-r border-slate-800 overflow-y-auto p-3 space-y-2 bg-[#090d18]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-2">
              Recorded Incidents ({incidents.length})
            </span>

            {loading ? (
              <div className="text-center py-8 text-xs text-slate-500">Loading incidents...</div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">No incident logs recorded yet.</div>
            ) : (
              incidents.map((inc) => {
                const isSelected = selectedIncident?.incidentId === inc.incidentId;
                const isCritical = inc.enrichedData.severity === 'critical';
                return (
                  <button
                    key={inc.incidentId}
                    onClick={() => setSelectedIncident(inc)}
                    className={`w-full text-left p-2.5 rounded-lg border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500/50 text-white shadow'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <span className="font-mono text-xs font-bold">{inc.incidentId}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(inc.occurredAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
                        isCritical ? 'bg-red-950 text-red-300' : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {inc.enrichedData.severity}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Selected Incident Detail */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0d1424]">
            {selectedIncident ? (
              <>
                {/* Detail Header & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-white font-mono">{selectedIncident.incidentId}</h3>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {selectedIncident.source}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Vehicle: <span className="text-slate-200 font-semibold">{selectedIncident.vehicleId}</span> • Occurred:{' '}
                      {new Date(selectedIncident.occurredAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Export and Print Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleExportJson(selectedIncident.incidentId)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      JSON
                    </button>
                    <button
                      onClick={() => handleExportCsv(selectedIncident.incidentId)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      CSV
                    </button>
                    <button
                      onClick={() => handlePrintReport(selectedIncident.incidentId)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Report
                    </button>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-[#111a2e] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Severity</span>
                    <span className="font-bold uppercase text-red-400 font-mono text-sm">
                      {selectedIncident.enrichedData.severity}
                    </span>
                  </div>
                  <div className="bg-[#111a2e] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Driver Response</span>
                    <span className="font-bold uppercase text-cyan-300 font-mono">
                      {selectedIncident.enrichedData.driverResponse}
                    </span>
                  </div>
                  <div className="bg-[#111a2e] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Responders</span>
                    <span className="font-bold uppercase text-emerald-400 font-mono">
                      {selectedIncident.enrichedData.responderStatus}
                    </span>
                  </div>
                  <div className="bg-[#111a2e] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Final Status</span>
                    <span className="font-bold uppercase text-slate-200 font-mono">
                      {selectedIncident.enrichedData.status}
                    </span>
                  </div>
                </div>

                {/* Location and Hazards */}
                <div className="bg-[#111a2e] p-3 rounded-lg border border-slate-800 text-xs space-y-1.5">
                  <span className="font-semibold text-slate-300 block">Incident Coordinates:</span>
                  <p className="font-mono text-cyan-300 text-xs">
                    Lat: {selectedIncident.enrichedData.location.latitude.toFixed(6)}, Lng:{' '}
                    {selectedIncident.enrichedData.location.longitude.toFixed(6)} (
                    {selectedIncident.enrichedData.location.addressDescription || 'Highway Section'})
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-slate-400">Detected Hazards:</span>
                    {selectedIncident.enrichedData.hazards.length === 0 ? (
                      <span className="text-slate-500 italic">None</span>
                    ) : (
                      selectedIncident.enrichedData.hazards.map((h) => (
                        <span key={h} className="px-2 py-0.5 rounded bg-red-950 text-red-300 text-[10px] font-mono">
                          {h}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Chronological Event Audit Trail Table */}
                <div className="bg-[#111a2e] p-3 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-200 text-xs block mb-2.5">
                    Chronological Event Audit Trail ({selectedIncident.events.length} events)
                  </span>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedIncident.events.map((evt, idx) => (
                      <div
                        key={evt.id || idx}
                        className="bg-slate-900/60 p-2 rounded border border-slate-800/80 text-xs flex items-start space-x-3"
                      >
                        <span className="text-[10px] text-slate-500 font-mono flex-shrink-0 mt-0.5">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                        <div className="flex-1">
                          <span className="font-semibold text-cyan-400 font-mono text-[11px] block">
                            [{evt.stage}] {evt.type}
                          </span>
                          <p className="text-slate-300 text-xs mt-0.5">{evt.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-slate-500 text-sm">Select an incident to view details.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

