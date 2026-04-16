import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Mic, X, Shield, Heart, Flame, Users,
  HelpCircle, Check, MessageCircle, Signal, Clock, PhoneCall, Square, Send, ArrowLeft,
  Wind, Mountain, Activity, Globe
} from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { offlineQueue } from '@/services/offlineQueue';
import { useDisasterMode } from '@/context/DisasterModeContext';

const EMERGENCY_NUMBER = '+919999999999';

const quickOptions = [
  { icon: AlertTriangle, label: 'I am in Danger',    category: 'danger',       priority: 'critical', color: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',         iconColor: 'text-red-500' },
  { icon: Heart,         label: 'Medical Emergency', category: 'medical',      priority: 'high',     color: 'bg-pink-500/10 border-pink-500/30 text-pink-600 dark:text-pink-400',       iconColor: 'text-pink-500' },
  { icon: Shield,        label: 'Women Safety',      category: 'women_safety', priority: 'high',     color: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400', iconColor: 'text-purple-500' },
  { icon: Flame,         label: 'Fire / Explosion',  category: 'fire',         priority: 'high',     color: 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400', iconColor: 'text-orange-500' },
  { icon: Users,         label: 'Need Rescue',       category: 'rescue',       priority: 'medium',   color: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',       iconColor: 'text-blue-500' },
  { icon: HelpCircle,    label: 'Other Help',        category: 'other',        priority: 'low',      color: 'bg-secondary border-border text-foreground',                               iconColor: 'text-muted-foreground' },
];

const disasterOptions = [
  { icon: AlertTriangle, label: 'Flood / Water Rise', category: 'flood',      priority: 'critical', color: 'bg-blue-600/10 border-blue-600/30 text-blue-700 dark:text-blue-400',     iconColor: 'text-blue-600' },
  { icon: Activity,      label: 'Earthquake',         category: 'earthquake', priority: 'critical', color: 'bg-amber-600/10 border-amber-600/30 text-amber-700 dark:text-amber-400',   iconColor: 'text-amber-600' },
  { icon: Mountain,      label: 'Landslide',          category: 'landslide',  priority: 'high',     color: 'bg-stone-600/10 border-stone-600/30 text-stone-700 dark:text-stone-400',   iconColor: 'text-stone-600' },
  { icon: Wind,          label: 'Cyclone / Storm',    category: 'storm',      priority: 'high',     color: 'bg-teal-600/10 border-teal-600/30 text-teal-700 dark:text-teal-400',     iconColor: 'text-teal-600' },
  { icon: HelpCircle,    label: 'Disaster Supply',    category: 'supply',     priority: 'medium',   color: 'bg-emerald-600/10 border-emerald-600/30 text-emerald-700 dark:text-emerald-400', iconColor: 'text-emerald-600' },
  { icon: Users,         label: 'Rescue Team',        category: 'rescue',     priority: 'high',     color: 'bg-indigo-600/10 border-indigo-600/30 text-indigo-700 dark:text-indigo-400', iconColor: 'text-indigo-600' },
];

const categoryScenarios: Record<string, string[]> = {
  danger: ["Someone is following me", "Physical threat/assault", "Armed individuals nearby"],
  medical: ["Difficulty breathing", "Severe chest pain", "Unconscious person", "Accident / Injury"],
  women_safety: ["Facing harassment", "Domestic distress", "Feeling unsafe/stalked"],
  fire: ["Building/House fire", "Gas leak or smell", "Electrical spark/short"],
  rescue: ["Stuck in a vehicle/building", "Flooding / Water rising", "Member missing"],
  other: ["Animal attack", "Theft reporting", "Vandalism"],
  // Disaster scenarios
  flood: ["Water entering house", "Trapped on roof", "Need evacuation by boat", "Drinking water shortage"],
  earthquake: ["Trapped under debris", "Building structurally unsafe", "Multiple injuries nearby", "Gas leakage suspected"],
  landslide: ["Road blocked by debris", "House buried / partially collapsed", "Immediate evacuation needed"],
  storm: ["Roof blown off", "Power lines down", "Communication broken", "Severe structural damage"],
  supply: ["Need food and medicines", "Running out of clean water", "Need warm clothing / blankets"],
};

declare global {
  interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; }
}

export function SOSButton() {
  const isOnline = useNetworkStatus();
  const { isDisasterMode } = useDisasterMode();
  const [isExpanded, setIsExpanded]   = useState(false);
  const [selectedOption, setSelectedOption] = useState<any | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [audioBlob, setAudioBlob]     = useState<Blob | null>(null);
  const [audioURL, setAudioURL]       = useState<string>('');
  const [sent, setSent]               = useState(false);
  const [isSending, setIsSending]     = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter]   = useState(0);
  const [speechError, setSpeechError] = useState('');

  // Refs — never stale in async callbacks
  const recognitionRef   = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const transcriptRef    = useRef('');  

  const currentOptions = isDisasterMode ? disasterOptions : quickOptions;
  const currentHeaderColor = isDisasterMode ? 'bg-blue-600' : 'bg-[hsl(0,84%,60%)]';

  const handleSOS = () => setIsExpanded(true);
  const handleClose = () => {
    recognitionRef.current?.abort();
    mediaRecorderRef.current?.stop();
    if (audioURL) URL.revokeObjectURL(audioURL);
    setIsExpanded(false);
    setSelectedOption(null);
    setIsRecording(false);
    setTranscript('');
    setAudioBlob(null);
    setAudioURL('');
    setSpeechError('');
    setSent(false);
    setIsSending(false);
    setRateLimited(false);
    setRetryAfter(0);
    transcriptRef.current = '';
    chunksRef.current = [];
  };

  useEffect(() => {
    if (retryAfter <= 0) return;
    const t = setInterval(() => {
      setRetryAfter(prev => {
        if (prev <= 1) { clearInterval(t); setRateLimited(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [retryAfter]);

  const getPos = async () => {
    let loc = { lat: 28.6139, lng: 77.2090 };
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
        );
        loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch { /* use default */ }
    }
    return loc;
  };

  const sendRequest = async (
    messageText: string,
    category = 'other',
    priority = 'low',
    audioB64?: string
  ): Promise<'ok' | 'rate_limited' | 'error'> => {
    setIsSending(true);
    const userId = localStorage.getItem('user_id') || 'anonymous_user';
    const loc    = await getPos();

    if (!isOnline) {
      await offlineQueue.add({ message: messageText, userId, location: loc, category, priority, timestamp: Date.now() });
      setIsSending(false);
      return 'ok';
    }

    try {
      const body: any = { message: messageText, userId, location: loc, category, priority };
      if (audioB64) body.voiceAudio = audioB64;
      
      // If it's a predefined scenario, tell backend to skip AI to save quota
      body.isPredefined = !transcriptRef.current && messageText !== 'Emergency Request';

      const res = await fetch(`${import.meta.env.VITE_API_URL}/triage/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      setIsSending(false);
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setRetryAfter(data.retry_after ?? 60);
        setRateLimited(true);
        return 'rate_limited';
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Server error ${res.status}` }));
        setSpeechError(err.error || `Request failed (${res.status}). Please try again.`);
        return 'error';
      }

      return 'ok';
    } catch (err) {
      console.error('SOS Error:', err);
      setIsSending(false);
      setSpeechError('Could not reach the server. Check your connection.');
      return 'error';
    }
  };

  const handleFinalSend = async () => {
    if (isSending) return;

    // Use transcript if available, otherwise use category label
    const message = transcript ? `🎙️ Voice message: "${transcript}"` : (selectedOption?.label || 'Emergency Request');
    const category = selectedOption?.category || 'other';
    const priority = selectedOption?.priority || 'medium';

    if (!isOnline) {
      const loc = await getPos();
      const userName = localStorage.getItem('user_name') || 'User';
      const userId   = localStorage.getItem('user_id')   || 'anon';
      const msg = `SOS ALERT: ${message.toUpperCase()}\nUser: ${userName}\nLoc: ${loc.lat},${loc.lng}\nPriority: ${priority.toUpperCase()}`;
      await offlineQueue.add({ message: `OFFLINE SOS: ${message}`, userId, location: loc, category, priority, timestamp: Date.now() });
      window.location.href = `sms:${EMERGENCY_NUMBER}?body=${encodeURIComponent(msg)}`;
      setSent(true);
      return;
    }

    let audioB64: string | undefined;
    if (chunksRef.current.length > 0) {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      audioB64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });
    }

    const result = await sendRequest(message, category, priority, audioB64);
    if (result === 'ok') { 
      setSent(true); 
    }
  };

  const handleRecord = async () => {
    if (!isRecording) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechError('Voice recognition not supported. Use Chrome or Edge.');
        return;
      }

      setSpeechError('');
      setTranscript('');
      setAudioBlob(null);
      setAudioURL('');
      transcriptRef.current = '';
      chunksRef.current = [];

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      recognition.onresult = (event: any) => {
        let final = ''; let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += chunk + ' ';
          else interim += chunk;
        }
        const next = (transcriptRef.current + final).trimStart() + interim;
        transcriptRef.current = next;
        setTranscript(next);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') setSpeechError('Mic permission denied.');
        else if (event.error !== 'no-speech') setSpeechError(`Error: ${event.error}`);
        setIsRecording(false);
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setAudioURL(URL.createObjectURL(blob));
        };
        recorder.start(250);
      } catch (err) { console.warn('MediaRecorder error', err); }

      recognition.start();
      setIsRecording(true);
    } else {
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      // We don't auto-send here now. User must review and click the final Send button.
    }
  };

  const isReadyToSend = selectedOption || transcript || audioURL;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9999]">
        <motion.button
          onClick={handleSOS}
          className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[hsl(0,84%,60%)] hover:bg-[hsl(0,84%,55%)] text-white shadow-[0_8px_32px_hsl(0,84%,60%,0.45)] font-display"
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
        >
          <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
            <PhoneCall className="w-4 h-4 relative z-10" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col items-start leading-none gap-0.5">
            <span className="text-[10px] font-semibold text-white/70 uppercase tracking-widest">1-Click</span>
            <span className="text-base font-black tracking-tight">Ask for Help</span>
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.96 }} transition={{ type: 'spring', stiffness: 420, damping: 35 }}
              className="w-full max-w-sm bg-card border border-border rounded-3xl overflow-hidden shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`relative ${currentHeaderColor} px-5 py-4 transition-colors duration-500`}>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedOption && !sent && !rateLimited && (
                      <button onClick={() => setSelectedOption(null)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4 text-white" />
                      </button>
                    )}
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                       {isDisasterMode ? <Globe className="w-5 h-5 text-white" /> : <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.5} />}
                    </div>
                    <div>
                      <p className="text-white font-black text-lg leading-none tracking-tight">
                        {isDisasterMode ? 'Disaster SOS' : 'Emergency SOS'}
                      </p>
                      <p className="text-white/70 text-xs mt-0.5">
                        {isDisasterMode ? 'Natural disaster assistance' : '1-tap personal help'}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center"><X className="w-4 h-4 text-white" /></button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {rateLimited ? (
                  <div className="text-center py-6 space-y-4">
                    <Clock className="w-12 h-12 mx-auto text-warning" />
                    <p className="font-bold">Wait {retryAfter}s</p>
                    <p className="text-xs text-muted-foreground">Too many requests. Please stay calm.</p>
                  </div>
                ) : sent ? (
                  <div className="text-center py-6 space-y-6">
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-success/15 border-2 border-success/30 flex items-center justify-center">
                        <Check className="w-8 h-8 text-success" />
                      </div>
                      <p className="font-display font-bold text-xl">Help is on the way!</p>
                      <p className="text-sm text-muted-foreground px-4">Nearby responders have been notified with your GPS coordinates.</p>
                    </div>

                    {/* TACTICAL SURVIVAL TIPS */}
                    <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-6 text-left space-y-4">
                       <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Immediate Tactical Advice</p>
                       </div>
                       <ul className="space-y-3">
                          {(() => {
                             const tips: Record<string, string[]> = {
                               danger: ["Find a safe, well-lit place", "Do not engage with the threat", "Stay on a call with someone"],
                               medical: ["Stay calm & breathe slowly", "Do not move if injury is severe", "Keep the person's airway clear"],
                               fire: ["Stay low to the ground", "Cover nose with wet cloth", "Touch doors before opening"],
                               flood: ["Move to higher ground immediately", "Avoid walking through moving water", "Disconnect electrical appliances"],
                               earthquake: ["Drop, Cover, and Hold on", "Stay away from glass & windows", "Move to an open area if outside"],
                               storm: ["Stay indoors & away from windows", "Charge communication devices", "Keep emergency supplies ready"],
                               general: ["Save battery power", "Stay visible for rescuers", "Keep your device signal active"]
                             };
                             const categoryTips = tips[selectedOption?.category] || tips.general;
                             return categoryTips.map((tip, i) => (
                               <li key={i} className="flex gap-3 text-sm font-bold items-start group">
                                 <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] shrink-0 font-black">
                                   0{i+1}
                                 </span>
                                 <span className="opacity-80 group-hover:opacity-100 transition-opacity">{tip}</span>
                               </li>
                             ));
                          })()}
                       </ul>
                    </div>
                    
                    <button 
                      onClick={handleClose}
                      className="w-full py-4 rounded-2xl bg-secondary text-foreground text-xs font-black uppercase tracking-widest hover:bg-secondary/80 transition-all"
                    >
                      Dismiss (Secure Protocol)
                    </button>
                  </div>
                ) : (
                  <>
                    {!selectedOption ? (
                      <div className="grid grid-cols-2 gap-2">
                        {currentOptions.map((opt) => (
                          <button
                            key={opt.label}
                            onClick={() => setSelectedOption(opt)}
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all text-center ${opt.color} hover:scale-[1.02] active:scale-[0.98]`}
                          >
                            <opt.icon className="w-6 h-6" />
                            <span className="text-[11px] font-bold uppercase tracking-tight leading-tight">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-2xl border ${selectedOption.color} flex items-center gap-3`}>
                          <selectedOption.icon className="w-6 h-6" />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-70">Selected</p>
                            <p className="font-bold text-base">{selectedOption.label}</p>
                          </div>
                        </div>

                        {/* Predefined Scenarios / Questions */}
                        {!transcript && !isRecording && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <MessageCircle className="w-4 h-4 text-primary" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Common Scenarios</p>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {categoryScenarios[selectedOption.category]?.map(scenario => (
                                <button
                                  key={scenario}
                                  onClick={() => setTranscript(scenario)}
                                  className="w-full p-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 text-left text-xs font-medium transition-all hover:pl-4"
                                >
                                  {scenario}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Voice Section */}
                        <div className="space-y-2">
                          {isRecording || transcript || audioURL ? (
                            <div className="bg-secondary/40 border border-border rounded-2xl p-3 space-y-2 relative">
                               {transcript && (
                                 <div className="relative">
                                    <p className="text-sm font-medium pr-8">"{transcript}"</p>
                                    <button onClick={() => setTranscript('')} className="absolute top-0 right-0 p-1 rounded-full hover:bg-destructive/10 text-destructive">
                                      <X className="w-3 h-3" />
                                    </button>
                                 </div>
                               )}
                              {audioURL && !isRecording && <audio src={audioURL} controls className="w-full h-8" />}
                              <button onClick={handleRecord} className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${isRecording ? 'bg-destructive text-white shadow-lg' : 'bg-primary/10 text-primary'}`}>
                                {isRecording ? <><Square className="w-3 h-3 fill-white" /> Stop Recording</> : <><Mic className="w-3 h-3" /> {transcript ? 'Re-record Voice' : 'Add Voice Message'}</>}
                              </button>
                            </div>
                          ) : (
                            <button onClick={handleRecord} className="w-full py-3 rounded-2xl border border-dashed border-border flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-secondary/40 transition-colors">
                              <Mic className="w-4 h-4" /> Add voice to explain more
                            </button>
                          )}
                        </div>

                        {speechError && <p className="text-[10px] text-destructive text-center font-bold px-4">{speechError}</p>}

                        {/* Final Send Button */}
                        <button
                          disabled={isSending}
                          onClick={handleFinalSend}
                          className="w-full py-4 rounded-2xl bg-destructive text-white font-black text-lg shadow-lg shadow-destructive/20 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {isSending ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                          {isOnline ? 'SEND SOS NOW' : 'SEND VIA SMS'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
