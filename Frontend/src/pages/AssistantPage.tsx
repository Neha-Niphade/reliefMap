import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Bot, Send, User, Sparkles, BookOpen, PhoneCall, Heart, Info, Clock, ChevronRight, MessageSquare, AlertTriangle, ShieldCheck, Activity, Wind, Globe, Flame, Mountain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDisasterMode } from '@/context/DisasterModeContext';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  'What should I do during an earthquake?',
  'How to perform CPR?',
  'First aid for burns',
  'Help with a panic attack',
];

const disasterSuggestions = [
  'Safe route to high ground?',
  'Emergency kit essentials',
  'Water purification methods',
  'How to signal for rescue?',
];

const quickGuides = [
  { 
    icon: Heart, 
    title: 'CPR Basics', 
    desc: 'Step-by-step for cardiac arrest',
    color: 'text-red-500', bg: 'bg-red-500/10',
    content: [
      "1. Check the scene for safety and responsiveness.",
      "2. Call emergency services (108/112) immediately.",
      "3. Place hands in the center of the chest (lower half of sternum).",
      "4. Push hard and fast (100-120 compressions per minute).",
      "5. Minimize interruptions to compressions."
    ]
  },
  { 
    icon: AlertTriangle, 
    title: 'Seizure Protocol', 
    desc: 'How to safely assist',
    color: 'text-warning', bg: 'bg-warning/10',
    content: [
      "1. Stay calm and record the start time of the seizure.",
      "2. Clear the area of hard or sharp objects.",
      "3. Do NOT hold the person down or put anything in their mouth.",
      "4. Cushion their head and loosen tight clothing (like a tie).",
      "5. After shaking stops, roll them onto their side."
    ]
  },
  { 
    icon: ShieldCheck, 
    title: 'Women Safety', 
    desc: 'Emergency protocols & alerts',
    color: 'text-info', bg: 'bg-info/10',
    content: [
      "1. Activate the 1-Click Panic button on the ReliefMap desk.",
      "2. Live location is instantly shared with the 5 nearest verified helpers.",
      "3. Head towards 'Blue Zones' (Verified Safe Hubs) on your map.",
      "4. Use Voice Record to capture evidence directly to the cloud."
    ]
  },
];

const disasterGuides = [
  { 
    icon: Activity, 
    title: 'Earthquake Safety', 
    desc: 'Drop, Cover, and Hold on',
    color: 'text-amber-600', bg: 'bg-amber-600/10',
    content: [
      "1. DROP where you are onto your hands and knees.",
      "2. COVER your head and neck with your arms.",
      "3. HOLD ON until the shaking stops.",
      "4. Stay away from windows and heavy furniture.",
      "5. If outside, find a clear spot away from buildings/trees."
    ]
  },
  { 
    icon: Wind, 
    title: 'Cyclone Prep', 
    desc: 'High wind survival guide',
    color: 'text-teal-600', bg: 'bg-teal-600/10',
    content: [
      "1. Secure loose objects around the house.",
      "2. Stay indoors and away from glass windows.",
      "3. Turn off electricity and gas if instructed.",
      "4. Keep your emergency kit and power banks ready.",
      "5. Listen to official radio broadcasts for evacuation alerts."
    ]
  },
  { 
    icon: Flame, 
    title: 'Flood / Tsunami', 
    desc: 'Rising water protocols',
    color: 'text-blue-600', bg: 'bg-blue-600/10',
    content: [
      "1. Move to the highest possible ground immediately.",
      "2. Do NOT walk or drive through flowing water.",
      "3. Beware of downed power lines in the water.",
      "4. If trapped in a building, go to the roof if necessary.",
      "5. Signal for help using a bright cloth or whistle."
    ]
  },
];

function AssistantPage() {
  const { isDisasterMode } = useDisasterMode();
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([
    { id: 'welcome', role: 'assistant', content: `👋 Hi! I'm your **ReliefMap AI**. I provide verified ${isDisasterMode ? 'natural disaster survival' : 'medical guidance'} and safety procedures.\n\n*How can I assist you today?*` },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ 
      id: 'welcome', 
      role: 'assistant', 
      content: `👋 Hi! I'm your **ReliefMap AI**. I provide verified ${isDisasterMode ? 'natural disaster survival' : 'medical guidance'} and safety procedures.\n\n*How can I assist you today?*` 
    }]);
  }, [isDisasterMode]);

  const currentGuides = isDisasterMode ? disasterGuides : quickGuides;
  const currentSuggestions = isDisasterMode ? disasterSuggestions : suggestions;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || isLoading) return;
    
    const userMsg: AIMessage = { id: `u_${Date.now()}`, role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chatbot/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: msg })
      });
      const data = await res.json();
      const aiMsg: AIMessage = { id: `a_${Date.now()}`, role: 'assistant', content: data.reply || data.error || "I am currently overloaded. Please try again or check our quick guides." };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      const aiMsg: AIMessage = { id: `a_${Date.now()}`, role: 'assistant', content: "Network error. Please ensure you are connected to the incident server." };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden p-4 md:p-6 lg:p-8">
        
        {/* ── HEADER ───────────────── */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
             <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${isDisasterMode ? 'bg-blue-600/10 border-blue-600/20' : 'bg-info/10 border-info/20'} flex items-center justify-center border shadow-inner transition-colors duration-500`}>
                   {isDisasterMode ? <Globe className="w-5 h-5 text-blue-600" /> : <Bot className="w-5 h-5 text-info" />}
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">Response <span className={`${isDisasterMode ? 'text-blue-600' : 'text-info'} not-italic transition-colors`}>AI</span></h1>
             </div>
             <p className="text-xs md:text-sm font-bold text-muted-foreground tracking-widest uppercase">{isDisasterMode ? 'Disaster Intelligence Terminal' : 'Certified Safety Intelligence Terminal'}</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-4 bg-secondary/50 p-2 pl-4 rounded-2xl border border-border">
               <div className="flex flex-col items-end">
                 <span className="text-[10px] font-black uppercase tracking-widest text-success">Active Node</span>
                 <span className="text-xs font-mono font-bold">relief.ai_v2.5</span>
               </div>
               <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                 <ShieldCheck className="w-5 h-5 text-success" />
               </div>
            </div>
          </div>
        </div>

        {/* ── MAIN LAYOUT: Golden Ratio Split (61.8% / 38.2%) ───────────────── */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
          
          {/* CHAT INTERFACE (61.8%) */}
          <div className="w-full lg:w-[61.8%] flex flex-col bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
             
             {/* Chat History */}
             <div 
               ref={scrollRef}
               className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar scroll-smooth"
             >
               <AnimatePresence mode="popLayout">
                 {messages.map((msg, idx) => (
                   <motion.div
                     key={msg.id}
                     initial={{ opacity: 0, scale: 0.98, y: 10 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     transition={{ delay: idx * 0.05 }}
                     className={`flex gap-4 md:gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                   >
                     <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-lg ${
                       msg.role === 'assistant' ? 'bg-info text-white' : 'bg-destructive text-white'
                     }`}>
                       {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                     </div>
                     <div className={`max-w-[85%] space-y-2`}>
                        <p className={`text-[10px] font-black uppercase tracking-tighter opacity-50 ${msg.role === 'user' ? 'text-right' : ''}`}>
                          {msg.role === 'assistant' ? 'System Intel' : 'Local User'}
                        </p>
                        <div className={`px-4 py-3 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm border ${
                          msg.role === 'user'
                            ? 'bg-destructive text-white border-destructive rounded-tr-none'
                            : 'bg-secondary/40 border-border rounded-tl-none font-medium text-foreground italic'
                        }`}>
                          {msg.content}
                        </div>
                     </div>
                   </motion.div>
                 ))}
                 {isLoading && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 items-center pl-14">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, delay: i * 0.2 }} className="w-1.5 h-1.5 bg-info rounded-full" />)}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-info italic">Analyzing Incident...</span>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>

             {/* Suggestions Shelf */}
             <div className="px-6 md:px-10 pb-4 flex flex-wrap gap-2">
                {messages.length < 5 && currentSuggestions.map(s => (
                  <button 
                    key={s} onClick={() => handleSend(s)}
                    className="px-4 py-2 rounded-xl bg-secondary hover:bg-info/10 hover:text-info hover:border-info/30 border border-border text-[11px] font-bold transition-all"
                  >
                    {s}
                  </button>
                ))}
             </div>

             {/* Input Bar */}
             <div className="p-4 md:p-6 pt-2 bg-secondary/20 border-t border-border shrink-0">
                <div className="flex gap-4 relative items-center max-w-2xl mx-auto">
                   <div className="absolute left-4 opacity-30">
                     <Sparkles className="w-4 h-4" />
                   </div>
                   <input
                     value={input}
                     onChange={e => setInput(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleSend()}
                     placeholder="Ask for high-priority assistance..."
                     className="w-full bg-card border border-border rounded-2xl pl-11 pr-14 py-3 text-sm md:text-base placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-info shadow-inner"
                   />
                   <button 
                     disabled={isLoading || !input.trim()} onClick={() => handleSend()}
                     className="absolute right-3 w-10 h-10 rounded-xl bg-info text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                   >
                     <Send className="w-4 h-4" />
                   </button>
                </div>
                <p className="mt-2 text-[8px] text-center text-muted-foreground font-black uppercase tracking-widest opacity-40">Triage Intelligence Protocol v2.5</p>
             </div>
          </div>

          {/* INTELLIGENCE SHELF (38.2%) */}
          <div className="w-full lg:w-[38.2%] flex flex-col gap-6 overflow-hidden min-h-0">
             
             {/* Quick Actions Card */}
             <div className="flex-1 flex flex-col bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden min-h-0">
                <div className="flex items-center gap-4 mb-4 shrink-0">
                   <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <BookOpen className="w-4 h-4" />
                   </div>
                   <h2 className="text-lg font-black tracking-tight uppercase">Emergency Wiki</h2>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-1">
                   {currentGuides.map(guide => (
                     <div 
                        key={guide.title} 
                        onClick={() => setSelectedGuide(guide)}
                        className="group p-4 rounded-2xl bg-secondary/30 border border-border hover:border-primary/30 transition-all cursor-pointer flex items-center gap-4"
                     >
                        <div className={`w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${guide.bg}`}>
                          <guide.icon className={`w-5 h-5 ${guide.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-black truncate">{guide.title}</p>
                           <p className="text-[10px] text-muted-foreground font-bold truncate tracking-widest uppercase opacity-70">{guide.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                   ))}
                </div>
                <button className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-secondary/40 transition-colors">
                  Explore Full Wiki
                </button>
             </div>
             {/* Direct Lines Card */}
             <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                  <PhoneCall className="w-32 h-32 text-primary" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                   <PhoneCall className="w-5 h-5 text-primary animate-pulse" /> Direct Response
                </h3>
                <div className="grid grid-cols-1 gap-3 relative z-10">
                   {[
                     { label: 'General Help', number: '108', color: 'bg-primary' },
                     { label: 'Police Desk', number: '100', color: 'bg-info' },
                     { label: 'Fire Response', number: '101', color: 'bg-orange-600' }
                   ].map(line => (
                     <button key={line.label} className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between hover:shadow-xl transition-all">
                        <div className="flex flex-col items-start leading-tight">
                           <span className="text-[10px] font-black uppercase text-muted-foreground">{line.label}</span>
                           <span className="text-lg font-black font-mono">{line.number}</span>
                        </div>
                        <div className={`w-10 h-10 rounded-2xl ${line.color} text-white flex items-center justify-center shadow-lg shadow-primary/20`}>
                           <PhoneCall className="w-4 h-4" />
                        </div>
                     </button>
                   ))}
                </div>
             </div>

             {/* Recent Intel Stats */}
             <div className="p-4 bg-card border border-border rounded-3xl shadow-sm shrink-0">
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
                      <p className="text-lg font-black">{messages.length}</p>
                      <p className="text-[8px] font-black uppercase tracking-tighter opacity-70">Conversations</p>
                   </div>
                   <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
                      <p className="text-lg font-black text-success">98%</p>
                      <p className="text-[8px] font-black uppercase tracking-tighter opacity-70">SLA Match</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
        
        <div className="mt-4 text-center shrink-0">
           <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 italic">© ReliefMap Intelligence Unit · Verified AI Guidance</p>
        </div>

        {/* ── EMERGENCY GUIDE MODAL ───────────────── */}
        <AnimatePresence>
          {selectedGuide && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
              onClick={() => setSelectedGuide(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-card border border-border rounded-[3rem] overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className={`p-10 ${selectedGuide.bg} border-b border-border space-y-4`}>
                   <div className="flex items-center justify-between">
                      <div className={`w-14 h-14 rounded-2xl bg-card flex items-center justify-center shadow-xl border border-border`}>
                         <selectedGuide.icon className={`w-7 h-7 ${selectedGuide.color}`} />
                      </div>
                      <button onClick={() => setSelectedGuide(null)} className="p-3 rounded-full bg-card/50 hover:bg-destructive hover:text-white transition-all"><ChevronRight className="w-6 h-6 rotate-90" /></button>
                   </div>
                   <div>
                     <h2 className="text-3xl font-black tracking-tighter uppercase">{selectedGuide.title}</h2>
                     <p className="text-sm font-bold opacity-60 uppercase tracking-widest">{selectedGuide.desc}</p>
                   </div>
                </div>
                <div className="p-10 space-y-6">
                   <div className="space-y-4">
                      {selectedGuide.content.map((step, i) => (
                        <motion.div 
                          key={i} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                          className="flex gap-4 items-start"
                        >
                           <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0 mt-1">
                             {i + 1}
                           </div>
                           <p className="text-base font-medium leading-relaxed">{step}</p>
                        </motion.div>
                      ))}
                   </div>
                   <button 
                     onClick={() => setSelectedGuide(null)}
                     className="w-full py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-8"
                   >
                     I Understand
                   </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

export default AssistantPage;
