import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, Info, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { offlineQueue } from '@/services/offlineQueue';
import { toast } from 'sonner';

export function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncCount, setLastSyncCount] = useState(0);

  useEffect(() => {
    if (isOnline) {
      handleSync();
    }
  }, [isOnline]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const count = await offlineQueue.syncWithServer();
      if (count > 0) {
        setLastSyncCount(count);
        toast.success(`${count} offline emergency requests synced successfully.`, {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        });
      }
    } catch (err) {
      console.error("Auto Sync Error:", err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[1000] bg-destructive text-destructive-foreground px-4 py-3 flex items-center justify-center gap-3 shadow-lg border-b border-white/10"
          >
            <WifiOff className="w-5 h-5 animate-pulse" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="font-bold text-sm tracking-tight uppercase">Offline Mode Activated</span>
              <span className="text-xs opacity-90 hidden sm:inline">|</span>
              <span className="text-xs">Emergency SOS will be sent via SMS & queued for sync.</span>
            </div>
            <motion.div 
               animate={{ opacity: [0.6, 1, 0.6] }} 
               transition={{ duration: 2, repeat: Infinity }}
               className="ml-4 flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest"
            >
               GPS Active
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {syncing && (
           <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9990] bg-emerald-600 text-white px-6 py-2 rounded-full flex items-center gap-3 shadow-2xl border border-emerald-400/30"
           >
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider">Syncing Offline Alerts...</span>
           </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
