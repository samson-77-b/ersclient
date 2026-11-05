import React, { useState, useEffect, useRef } from 'react';
import { DigitalTwinState, OccupantInteractionState } from '../../types';
import { api } from '../../services/api';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  MessageSquare,
  ShieldAlert,
  Flame,
  HeartPulse,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Radio,
  User,
  Bot
} from 'lucide-react';

interface OccupantInteractiveConsoleProps {
  twin: DigitalTwinState;
}

export const OccupantInteractiveConsole: React.FC<OccupantInteractiveConsoleProps> = ({ twin }) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTtsMuted, setIsTtsMuted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const lastSpokenMessageIdRef = useRef<string | null>(null);

  const dialog: OccupantInteractionState = twin.dialog || {
    triageStep: 'IDLE',
    messages: [],
    availableQuickReplies: [],
    reportedInjuries: [],
    reportedHazards: [],
    canMoveSafely: null,
    needsImmediateRescue: false,
    activeInstructions: []
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [dialog.messages]);

  // Automatic voice synthesis (TTS) when new assistant instruction arrives
  useEffect(() => {
    if (isTtsMuted || !('speechSynthesis' in window)) return;

    const latestMsg = dialog.messages[dialog.messages.length - 1];
    if (latestMsg && latestMsg.sender === 'assistant' && latestMsg.id !== lastSpokenMessageIdRef.current) {
      lastSpokenMessageIdRef.current = latestMsg.id;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(latestMsg.text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [dialog.messages, isTtsMuted]);

  // Voice recognition (Speech-to-Text) using browser Web Speech API
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. You can use the quick replies or typed text.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSend(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const message = (textToSend || inputText).trim();
    if (!message || isSending) return;

    setIsSending(true);
    setInputText('');
    try {
      await api.sendOccupantReply(twin.vehicleId, message);
    } catch (err) {
      console.error('Failed to send occupant reply:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-950/70 border-red-500/60 text-red-300';
      case 'high':
        return 'bg-amber-950/70 border-amber-500/60 text-amber-300';
      default:
        return 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300';
    }
  };

  const getPriorityIcon = (type: string) => {
    switch (type) {
      case 'evacuation':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'first_aid':
        return <HeartPulse className="w-4 h-4 text-red-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="bg-[#0d1424] border border-slate-800/80 rounded-xl p-4 shadow-xl flex flex-col space-y-4">
      {/* Console Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase">
            In-Cabin Interactive Assistant & Occupant Dialog
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* Audio TTS toggle */}
          <button
            onClick={() => setIsTtsMuted(!isTtsMuted)}
            className={`p-1.5 rounded-lg border transition text-xs flex items-center gap-1 ${
              isTtsMuted
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40'
            }`}
            title={isTtsMuted ? 'Unmute Assistant Voice' : 'Mute Assistant Voice'}
          >
            {isTtsMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="text-[10px] hidden sm:inline">{isTtsMuted ? 'Muted' : 'Voice Active'}</span>
          </button>

          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
            Triage: <strong className="text-cyan-400">{dialog.triageStep}</strong>
          </span>
        </div>
      </div>

      {/* Two Column Layout: Left = Active Instructions Cards, Right = Conversational Assistant Feed */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Real-Time Instructions Cards (5 cols) */}
        <div className="md:col-span-5 flex flex-col space-y-2.5">
          <span className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Scenario-Based Safety Instructions:</span>
            <span className="text-[10px] text-slate-500 font-mono">
              {dialog.activeInstructions.length} Active
            </span>
          </span>

          <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
            {dialog.activeInstructions.length === 0 ? (
              <div className="bg-[#111a2e] border border-slate-800/80 rounded-lg p-4 text-center text-slate-500 text-xs">
                <HelpCircle className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
                Awaiting crash trigger or scenario start to issue protocol instructions.
              </div>
            ) : (
              dialog.activeInstructions.map((inst) => (
                <div
                  key={inst.id}
                  className={`p-3 rounded-lg border flex items-start space-x-2.5 shadow transition ${getPriorityStyle(
                    inst.priority
                  )}`}
                >
                  <div className="p-1 rounded bg-black/30 mt-0.5 flex-shrink-0">
                    {getPriorityIcon(inst.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wide">{inst.title}</h4>
                      <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-black/40">
                        {inst.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-200 mt-1 leading-relaxed">
                      {inst.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Occupant Status Summary Indicators */}
          {(dialog.reportedInjuries.length > 0 || dialog.reportedHazards.length > 0) && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs space-y-1.5">
              {dialog.reportedInjuries.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400 text-[10px] uppercase">Reported Injuries:</span>
                  {dialog.reportedInjuries.map((inj) => (
                    <span key={inj} className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 font-mono text-[10px] font-bold">
                      {inj}
                    </span>
                  ))}
                </div>
              )}
              {dialog.reportedHazards.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400 text-[10px] uppercase">Hazards:</span>
                  {dialog.reportedHazards.map((hz) => (
                    <span key={hz} className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono text-[10px] font-bold">
                      {hz}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Interactive Chat / Voice Dialog Thread (7 cols) */}
        <div className="md:col-span-7 flex flex-col h-[350px] bg-[#090d18] border border-slate-800 rounded-lg overflow-hidden">
          {/* Messages feed */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {dialog.messages.length === 0 ? (
              <div className="text-center py-16 text-slate-600 text-xs">
                <Bot className="w-7 h-7 mx-auto mb-2 text-slate-600" />
                In-cabin voice assistant standby. Trigger accident or scenario to initiate occupant triage.
              </div>
            ) : (
              dialog.messages.map((msg) => {
                const isAssistant = msg.sender === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-2 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAssistant && (
                      <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs shadow ${
                        isAssistant
                          ? 'bg-[#121c33] text-slate-100 border border-slate-700/70'
                          : 'bg-cyan-600 text-white'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      <span className="text-[9px] text-slate-400 block mt-1 text-right font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    {!isAssistant && (
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-cyan-300 flex-shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Contextual Quick Reply Chips */}
          {dialog.availableQuickReplies.length > 0 && (
            <div className="p-2 border-t border-slate-800/80 bg-[#0d1424] flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block w-full mb-0.5">
                Suggested Quick Responses (Click to speak):
              </span>
              {dialog.availableQuickReplies.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickReply(reply)}
                  className="px-2.5 py-1 rounded-md bg-slate-800/90 hover:bg-cyan-600 hover:text-white text-cyan-300 border border-slate-700/80 text-[11px] font-medium transition shadow-sm"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Interactive Voice & Custom Message Input Bar */}
          <div className="p-2.5 border-t border-slate-800 bg-[#0a0f1d] flex items-center space-x-2">
            {/* Microphone Button (Speech Recognition) */}
            <button
              onClick={toggleSpeechRecognition}
              className={`p-2 rounded-lg border transition flex-shrink-0 ${
                isListening
                  ? 'bg-red-600 text-white border-red-500 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Click to speak using your microphone'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? 'Listening to voice...' : 'Type response (e.g. "Bleeding", "Door stuck", "I am safe")...'}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={isSending || !inputText.trim()}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 transition shadow disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

