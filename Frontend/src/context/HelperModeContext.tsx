import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface HelperModeContextType {
  isAvailable: boolean;
  toggleAvailable: () => Promise<void>;
}

const HelperModeContext = createContext<HelperModeContextType | undefined>(undefined);

export const HelperModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const userId = localStorage.getItem('user_id');

  // Load initial state from Firestore
  useEffect(() => {
    if (!userId || !db) return;
    getDoc(doc(db, 'users', userId)).then((snapshot) => {
      if (snapshot.exists()) {
        setIsAvailable(snapshot.data().isAvailable === true);
      }
    });
  }, [userId]);

  const toggleAvailable = async () => {
    if (!userId) {
      alert('Please log in to activate Helper Mode.');
      return;
    }
    const newStatus = !isAvailable;
    setIsAvailable(newStatus); // Optimistic update

    try {
      if (newStatus && navigator.geolocation) {
        // When turning ON, also capture fresh location
        navigator.geolocation.getCurrentPosition((pos) => {
          updateDoc(doc(db, 'users', userId), {
            isAvailable: newStatus,
            location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          });
        });
      } else {
        await updateDoc(doc(db, 'users', userId), { isAvailable: newStatus });
      }
    } catch (e) {
      console.error(e);
      alert('Failed to sync helper status.');
      setIsAvailable(!newStatus); // Revert on failure
    }
  };

  return (
    <HelperModeContext.Provider value={{ isAvailable, toggleAvailable }}>
      {children}
    </HelperModeContext.Provider>
  );
};

export const useHelperMode = () => {
  const context = useContext(HelperModeContext);
  if (context === undefined) {
    throw new Error('useHelperMode must be used within a HelperModeProvider');
  }
  return context;
};
