import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export function HelperToggle() {
  const [isAvailable, setIsAvailable] = useState(false);
  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    if (!userId || !db) return;
    getDoc(doc(db, 'users', userId)).then(snapshot => {
      if (snapshot.exists()) {
        setIsAvailable(snapshot.data().isAvailable === true);
      }
    });
  }, [userId]);

  const toggleStatus = async () => {
    if (!userId) {
      alert("Please log in to activate Helper Mode.");
      return;
    }
    const newStatus = !isAvailable;
    setIsAvailable(newStatus); // Optimistic UI update
    
    try {
      const payload: any = { isAvailable: newStatus };
      
      // If toggling ON, try to grab the latest location and update it natively
      if (newStatus && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          updateDoc(doc(db, 'users', userId), {
            isAvailable: newStatus,
            location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
          });
        });
      } else {
        await updateDoc(doc(db, 'users', userId), payload);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to sync helper status.");
    }
  };

  return (
    <motion.button
      onClick={toggleStatus}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full ${
        isAvailable ? 'bg-accent/15 border border-accent/30' : 'bg-secondary border border-border'
      }`}
      whileTap={{ scale: 0.98 }}
    >
      {isAvailable ? (
        <ShieldCheck className="w-5 h-5 text-accent" />
      ) : (
        <Shield className="w-5 h-5 text-muted-foreground" />
      )}
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold">
          {isAvailable ? 'Available to Help' : 'Helper Mode Off'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isAvailable ? 'You will receive nearby alerts' : 'Toggle to receive help requests'}
        </p>
      </div>
      <div className={`w-11 h-6 rounded-full relative transition-colors ${
        isAvailable ? 'bg-accent' : 'bg-muted'
      }`}>
        <motion.div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-foreground"
          animate={{ left: isAvailable ? '22px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </motion.button>
  );
}
