import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Mic, X, Shield, Heart, Flame, Users, HelpCircle, Check } from 'lucide-react';

const quickOptions = [
  { icon: AlertTriangle, label: 'I am in danger', category: 'danger' },
  { icon: Heart, label: 'Medical emergency', category: 'medical' },
  { icon: Shield, label: 'Unsafe situation', category: 'women_safety' },
  { icon: Flame, label: 'Fire emergency', category: 'fire' },
  { icon: Users, label: 'Need immediate rescue', category: 'rescue' },
  { icon: HelpCircle, label: 'Other emergency', category: 'other' },
];

export function SOSButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSOS = () => setIsExpanded(true);
  const handleClose = () => { setIsExpanded(false); setIsRecording(false); setSent(false); };

  const sendRequest = async (messageText: string) => {
    const userId = localStorage.getItem('user_id') || 'anonymous_user';
    
    // Default fallback
    let userLoc = { lat: 28.6139, lng: 77.2090 };
    
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (err) {
        console.error("SOS Loc Error:", err);
      }
    }
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/triage/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, userId, location: userLoc })
      });
    } catch (err) {
      console.error("SOS Error:", err);
    }
  }

  const handleQuickSelect = async (label: string) => {
    await sendRequest(label);
    setSent(true);
    setTimeout(() => { setSent(false); setIsExpanded(false); }, 2000);
  };

  const handleRecord = async () => {
    setIsRecording(!isRecording);
    if (isRecording) {
      await sendRequest("Recorded emergency voice note");
      setSent(true);
      setTimeout(() => { setSent(false); setIsExpanded(false); setIsRecording(false); }, 2000);
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
                <h2 className="font-display text-xl font-bold text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" /> Emergency SOS
                </h2>
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
                  <div className="w-16 h-16 mx-auto rounded-full gradient-safe flex items-center justify-center text-primary-foreground">
                    <Check className="w-8 h-8" />
                  </div>
                  <p className="font-display font-bold text-lg">SOS Sent!</p>
                  <p className="text-sm text-muted-foreground">Nearby helpers are being notified</p>
                </motion.div>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Quick select your situation:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickOptions.map(opt => (
                        <motion.button
                          key={opt.label}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleQuickSelect(opt.label)}
                          className="flex items-center gap-2 p-3 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium text-secondary-foreground transition-colors text-left"
                        >
                          <opt.icon className="w-4 h-4 text-primary shrink-0" />
                          {opt.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground mb-3">Or record a voice message:</p>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRecord}
                      className={`w-full py-4 rounded-xl font-display font-bold flex items-center justify-center gap-2 transition-colors ${
                        isRecording
                          ? 'bg-primary animate-pulse'
                          : 'bg-secondary hover:bg-secondary/80'
                      } text-foreground`}
                    >
                      <Mic className={`w-5 h-5 ${isRecording ? 'text-primary-foreground' : 'text-primary'}`} />
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
