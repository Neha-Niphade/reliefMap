import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Mic, X, Shield, Heart, Flame, Users, HelpCircle, Check, MessageCircle, Signal } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { offlineQueue } from '@/services/offlineQueue';

const EMERGENCY_NUMBER = "+919999999999"; // Default Admin/Rescue line

const quickOptions = [
  { icon: AlertTriangle, label: 'Danger', category: 'danger', priority: 'critical' },
  { icon: Heart, label: 'Medical', category: 'medical', priority: 'high' },
  { icon: Shield, label: 'Safety', category: 'women_safety', priority: 'high' },
  { icon: Flame, label: 'Fire', category: 'fire', priority: 'high' },
  { icon: Users, label: 'Rescue', category: 'rescue', priority: 'medium' },
  { icon: HelpCircle, label: 'Other', category: 'other', priority: 'low' },
];

export function SOSButton() {
  const isOnline = useNetworkStatus();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sent, setSent] = useState(false);
  const [offlineForm, setOfflineForm] = useState(false);

  const handleSOS = () => setIsExpanded(true);
  const handleClose = () => { 
    setIsExpanded(false); 
    setIsRecording(false); 
    setSent(false); 
    setOfflineForm(false);
  };

  const getPos = async () => {
    let loc = { lat: 28.6139, lng: 77.2090 };
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => {
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 });
        });
        loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (err) { console.error("Loc Error:", err); }
    }
    return loc;
  };

  const handleOfflineSOS = async (option: typeof quickOptions[0]) => {
     const loc = await getPos();
     const userName = localStorage.getItem('user_name') || 'User';
     const userId = localStorage.getItem('user_id') || 'anon';
     
     // 1. Prepare SMS Body
     const msg = `SOS ALERT: ${option.label.toUpperCase()}\nUser: ${userName}\nLoc: ${loc.lat},${loc.lng}\nPriority: ${option.priority.toUpperCase()}\nStatus: EMERGENCY`;
     
     // 2. Open SMS Intent
     const smsIntent = `sms:${EMERGENCY_NUMBER}?body=${encodeURIComponent(msg)}`;
     
     // 3. Queue for synchronization
     await offlineQueue.add({
       message: `OFFLINE SMS: ${option.label}`,
       userId,
       location: loc,
       category: option.category,
       priority: option.priority,
       timestamp: Date.now()
     });
     
     window.location.href = smsIntent;
     setSent(true);
     setTimeout(handleClose, 3000);
  };

  const sendRequest = async (messageText: string, category: string = 'other', priority: string = 'low') => {
    const userId = localStorage.getItem('user_id') || 'anonymous_user';
    const loc = await getPos();
    
    if (!isOnline) {
       await offlineQueue.add({
          message: messageText,
          userId,
          location: loc,
          category,
          priority,
          timestamp: Date.now()
       });
       return;
    }
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/triage/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, userId, location: loc, category, priority })
      });
    } catch (err) {
      console.error("SOS Error:", err);
    }
  }

  const handleQuickSelect = async (opt: typeof quickOptions[0]) => {
    if (!isOnline) {
       await handleOfflineSOS(opt);
       return;
    }
    await sendRequest(opt.label, opt.category, opt.priority);
    setSent(true);
    setTimeout(handleClose, 2000);
  };

  const handleRecord = async () => {
    setIsRecording(!isRecording);
    if (isRecording) {
      if (!isOnline) {
         window.location.href = `sms:${EMERGENCY_NUMBER}?body=${encodeURIComponent("SOS ALERT: Voice message recorded offline.")}`;
      }
      await sendRequest("Recorded emergency voice note");
      setSent(true);
      setTimeout(handleClose, 2000);
    }
  };

  return (
    <>
      <motion.button
        onClick={handleSOS}
        className="fixed bottom-6 right-6 z-[9999] w-20 h-20 rounded-full gradient-emergency glow-sos flex items-center justify-center pulse-sos"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <AlertTriangle className="w-8 h-8 text-primary-foreground" />
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h2 className="font-display text-xl font-bold text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6" /> Emergency SOS
                  </h2>
                  {!isOnline && (
                    <div className="flex items-center gap-1.5 text-[10px] text-destructive font-black mt-1 uppercase tracking-widest bg-destructive/10 px-2 py-0.5 rounded-full w-fit">
                       <Signal className="w-3 h-3 animate-pulse" /> Offline SMS Mode
                    </div>
                  )}
                </div>
                <button onClick={handleClose} className="p-1 rounded-full hover:bg-secondary">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {sent ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8 space-y-3"
                >
                  <div className={`w-16 h-16 mx-auto rounded-full ${isOnline ? 'gradient-safe' : 'bg-destructive/15'} flex items-center justify-center text-primary-foreground`}>
                    {isOnline ? <Check className="w-8 h-8 text-white" /> : <MessageCircle className="w-8 h-8 text-destructive" />}
                  </div>
                  <p className="font-display font-bold text-lg">
                    {isOnline ? 'SOS Sent!' : 'SMS Generated!'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isOnline 
                      ? 'Nearby helpers are being notified' 
                      : 'Please send the pre-filled SMS to trigger fallback alert.'}
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-4">
                    {!isOnline && (
                       <div className="bg-destructive/5 p-3 rounded-xl border border-destructive/20 text-[11px] leading-relaxed text-destructive/80 font-bold">
                          <Info className="w-4 h-4 inline mr-2 -mt-0.5" />
                          No internet connection. SOS will generate an SMS intent and auto-sync coordinates when connectivity returns.
                       </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Quick select your situation:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {quickOptions.map(opt => (
                          <motion.button
                            key={opt.label}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleQuickSelect(opt)}
                            className="flex items-center gap-2 p-3 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-bold text-secondary-foreground transition-all border border-transparent shadow-sm hover:border-border"
                          >
                            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-inner">
                               <opt.icon className="w-4 h-4 text-primary shrink-0" />
                            </div>
                            {opt.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground mb-3">Or record a voice message:</p>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRecord}
                      className={`w-full py-4 rounded-xl font-display font-bold flex items-center justify-center gap-2 transition-all ${
                        isRecording
                          ? 'bg-primary animate-pulse shadow-lg'
                          : 'bg-secondary hover:bg-secondary/80'
                      } text-foreground`}
                    >
                      <Mic className={`w-5 h-5 ${isRecording ? 'text-primary-foreground text-white' : 'text-primary'}`} />
                      {isRecording ? 'Stop & Send' : 'Hold to Record'}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
