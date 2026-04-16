import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, MapPin } from 'lucide-react';

// Using a reliable short alert sound from Google's sound library (or any equivalent mp3/ogg)
const ALERT_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';

export function EmergencyAlerts() {
  const [alertData, setAlertData] = useState<any>(null);
  
  // Track IDs we've already alerted for, so we don't spam.
  const seenIds = useRef<Set<string>>(new Set());
  const soundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    soundRef.current = new Audio(ALERT_SOUND_URL);
  }, []);

  useEffect(() => {
    if (!db) return;
    
    // We query the most recent 10 requests to avoid complex Firebase composite index errors.
    // Client-side filtering ensures we only alert on HIGH/CRITICAL newly minted requests.
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Loop over changes so we can specifically catch 'added' or 'modified' 
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = { id: change.doc.id, ...change.doc.data() } as any;
          const currentUserId = localStorage.getItem('user_id');
          
          // Conditions to trigger popup:
          // 1. Not already seen
          // 2. High or Critical
          // 3. Status is active/requested
          // 4. Not requested by the current user
          // 5. Must be less than 60 seconds old to prevent alerting old data on load
          
          if (!seenIds.current.has(data.id)) {
            // Register it as seen immediately
            seenIds.current.add(data.id);

            const isUrgent = ['high', 'critical'].includes((data.urgency || '').toLowerCase());
            const isRequested = ['requested', 'active'].includes((data.status || 'requested').toLowerCase());
            const timeDiff = Date.now() - new Date(data.createdAt).getTime();
            const isRecent = timeDiff < 60 * 1000; // Only alert if younger than 60s
            
            if (isUrgent && isRequested && isRecent && data.userId !== currentUserId) {
              triggerAlert(data);
            }
          }
        }
      });
    }, (error) => {
      console.log('Firebase alert error:', error);
    });

    return () => unsubscribe();
  }, []);

  const triggerAlert = (data: any) => {
    setAlertData(data);
    
    // Play sound but handle browser autoplay policies safely
    if (soundRef.current) {
      soundRef.current.play().catch(e => console.log('Audio play blocked by browser policy:', e));
    }
    
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setAlertData((prev: any) => (prev && prev.id === data.id ? null : prev));
    }, 6000);
  };

  return (
    <AnimatePresence>
      {alertData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -40, x: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="fixed top-20 right-4 sm:top-6 sm:right-6 z-[99999] w-[calc(100vw-32px)] sm:w-full max-w-[360px] bg-background rounded-2xl shadow-[0_0_40px_-10px_rgba(220,38,38,0.4)] border border-sos/40 overflow-hidden text-foreground"
        >
          {/* Top pulse bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-sos animate-pulse" />
          
          <div className="p-4 sm:p-5 flex gap-4 items-start relative">
            {/* Pulsing Icon Ring */}
            <div className="w-12 h-12 rounded-full bg-sos/15 flex items-center justify-center shrink-0 border border-sos/30 relative">
              <div className="absolute inset-0 bg-sos/20 rounded-full animate-ping" />
              <AlertTriangle className="w-6 h-6 text-sos relative z-10" />
            </div>
            
            <div className="flex-1 space-y-1.5 pr-6">
              <h3 className="font-display font-bold text-sos text-[15px] leading-tight">
                🚨 Urgent Help Needed!
              </h3>
              
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary text-primary">
                  {alertData.category || 'Critical Alert'}
                </span>
              </div>
              
              <p className="text-sm font-medium line-clamp-2 leading-snug pt-0.5 text-muted-foreground">
                {alertData.description}
              </p>
              
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/50 mt-2 uppercase tracking-wide">
                <MapPin className="w-3 h-3 text-primary" />
                <span>{(alertData.distance || 0).toFixed(1)} km away · Active</span>
              </div>
            </div>

            <button
              onClick={() => setAlertData(null)}
              className="absolute top-3 right-3 text-muted-foreground/60 hover:text-foreground w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
