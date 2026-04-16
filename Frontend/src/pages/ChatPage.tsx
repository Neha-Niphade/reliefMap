import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Send, MessageCircle, MapPin, Navigation, Clock, User, Phone, ShieldAlert, CheckCircle, ChevronRight, Search, Activity, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, where, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useUserMap } from '@/hooks/useUserMap';
import { useDisasterMode } from '@/context/DisasterModeContext';
import { Globe } from 'lucide-react';

function ChatPage() {
  const { isDisasterMode } = useDisasterMode();
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [input, setInput] = useState('');
  const [threads, setThreads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const { getUserName } = useUserMap();
  
  const currentUserId = localStorage.getItem('user_id') || 'anonymous';
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load threads from local DB
  useEffect(() => {
    if (!currentUserId || currentUserId === 'anonymous') return;
    
    const fetchThreads = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/threads/?userId=${currentUserId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        // De-duplicate per user (though backend should handle it, we keep it safe)
        const uniqueThreadsMap = new Map();
        data.forEach((t: any) => {
          const otherId = t.participantIds?.find((id: string) => id?.trim() !== currentUserId?.trim()) || 'unknown';
          if (!uniqueThreadsMap.has(otherId)) uniqueThreadsMap.set(otherId, t);
        });
        setThreads(Array.from(uniqueThreadsMap.values()));
      } catch (err) {
        console.error("Local Thread Load error:", err);
      }
    };

    fetchThreads();
    const timer = setInterval(fetchThreads, 5000); // 5s polling for threads
    return () => clearInterval(timer);
  }, [currentUserId]);

  // Load messages from local DB
  useEffect(() => {
    if (!selectedChat) return;
    
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/${selectedChat.id}/`);
        if (!res.ok) return;
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Local Message Load error:", err);
      }
    };

    // Load active request metadata (Location, Urgency) from Firestore
    const fetchRequestMetadata = async () => {
      if (!selectedChat.requestId) return;
      try {
        const docRef = doc(db, 'posts', selectedChat.requestId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setActiveRequest({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error("Firestore Request Metadata fetch error:", err);
      }
    };

    fetchMessages();
    fetchRequestMetadata();
    
    const timer = setInterval(fetchMessages, 2500); // 2.5s polling for active chat
    return () => { clearInterval(timer); setActiveRequest(null); };
  }, [selectedChat]);

  const handleSend = async () => {
    if (!input.trim() || !selectedChat) return;
    const text = input;
    const currentUserName = localStorage.getItem('user_name') || 'Rescuer';
    setInput('');
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/send-message/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: selectedChat.id,
          senderId: currentUserId,
          senderName: currentUserName,
          content: text
        })
      });
    } catch (e) {
      console.error("Failed to send message to local DB:", e);
    }
  };

  const handleNavigate = () => {
    if (!activeRequest?.location?.lat) return alert("No location data for this emergency.");
    const { lat, lng } = activeRequest.location;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
  };

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto p-0 md:p-6 lg:p-8 h-[calc(100vh-48px)]">
        
        {/* ── GRID: Golden Ratio Split (38.2% List / 61.8% Chat) ───────────────── */}
        <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex h-full">
          
          {/* LEFT: Conversation List (38.2%) */}
          <div className="w-full md:w-[38.2%] border-r border-border flex flex-col bg-secondary/10">
            <div className="p-6 border-b border-border space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black tracking-tighter uppercase italic">Secure <span className="text-primary not-italic">Comms</span></h2>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                <input placeholder="Search victims or rescuers..." className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
               {threads.length === 0 ? (
                 <div className="p-10 text-center space-y-4 opacity-50">
                    <ShieldAlert className="w-12 h-12 mx-auto" />
                    <p className="text-xs font-black uppercase tracking-widest">No Active Channels</p>
                 </div>
               ) : (
                 threads.map(chat => (
                   <button
                     key={chat.id}
                     onClick={() => setSelectedChat(chat)}
                     className={`w-full text-left p-6 border-b border-border/50 transition-all hover:bg-white/5 relative group ${
                       selectedChat?.id === chat.id ? 'bg-white/10' : ''
                     }`}
                   >
                     {selectedChat?.id === chat.id && <div className="absolute left-0 top-0 w-1 h-full bg-primary" />}
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center text-xs font-black shadow-lg">
                           {getUserName(chat.participantIds.find((id: string) => id?.trim() !== currentUserId?.trim()))?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center mb-1">
                              <p className="font-black text-xs truncate uppercase tracking-tight">
                                {getUserName(chat.participantIds.find((id: string) => id?.trim() !== currentUserId?.trim()))}
                              </p>
                              <span className="text-[9px] font-mono text-muted-foreground opacity-50">
                                {chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                           </div>
                           <p className="text-xs text-muted-foreground truncate font-medium group-hover:text-foreground transition-colors">
                             {chat.lastSenderId === currentUserId ? 'You: ' : ''}{chat.lastMessage}
                           </p>
                        </div>
                     </div>
                   </button>
                 ))
               )}
            </div>
          </div>

          {/* RIGHT: Active conversation (61.8%) */}
          <div className="flex-1 flex flex-col bg-card">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-5 md:p-6 border-b border-border bg-secondary/5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shadow-inner relative">
                       <User className="w-5 h-5 text-muted-foreground" />
                       <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-card" />
                     </div>
                     <div>
                       <h3 className="text-lg font-black tracking-tight leading-none uppercase">
                         {getUserName(selectedChat.participantIds.find((id: string) => id?.trim() !== currentUserId?.trim()))}
                       </h3>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-success">Verified Channel</span>
                          <span className="opacity-20">|</span>
                          <span className="text-[10px] font-mono text-muted-foreground">INCIDENT_LOCK_ACTIVE</span>
                       </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-2">
                     <button 
                       onClick={handleNavigate}
                       className="px-6 py-2.5 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                     >
                       <Navigation className="w-3.5 h-3.5" /> Navigate
                     </button>
                     <button className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center hover:bg-destructive hover:text-white transition-all group">
                       <ShieldAlert className="w-4.5 h-4.5 group-hover:scale-110" />
                     </button>
                  </div>
                </div>

                {/* Messages Body */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 no-scrollbar bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-[0.98]"
                >
                  <AnimatePresence mode="popLayout">
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${msg.senderId?.trim() === currentUserId?.trim() ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm md:text-base shadow-sm ${
                          msg.senderId?.trim() === currentUserId?.trim()
                            ? 'bg-primary text-white rounded-br-none shadow-primary/20'
                            : 'bg-secondary/60 border border-border text-foreground rounded-bl-none'
                        }`}>
                          {msg.senderId?.trim() !== currentUserId?.trim() && (
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1.5 opacity-60 italic">Rescuer Info</p>
                          )}
                          <p className="font-medium leading-relaxed">{msg.content}</p>
                          <p className={`text-[9px] mt-2 opacity-40 font-mono ${msg.senderId === currentUserId ? 'text-right' : ''}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Message Input */}
                <div className="p-6 md:p-8 bg-secondary/5 border-t border-border">
                  <div className="flex gap-4 relative items-center max-w-4xl mx-auto">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      placeholder="Type priority response..."
                      className="flex-1 bg-card border border-border rounded-2xl px-6 py-4 text-sm md:text-base shadow-inner focus:outline-none focus:ring-1 focus:ring-primary h-14"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xl shadow-primary/30 hover:scale-110 active:scale-90 transition-all disabled:opacity-30 disabled:grayscale"
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-6">
                 <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
                    <MessageCircle className="w-10 h-10 text-muted-foreground opacity-20" />
                 </div>
                 <div className="max-w-xs">
                    <h4 className="text-xl font-black uppercase tracking-tighter italic">Tactical Comms</h4>
                    <p className="text-sm text-muted-foreground font-medium mt-2">Pick an incident thread to begin professional coordination.</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default ChatPage;
