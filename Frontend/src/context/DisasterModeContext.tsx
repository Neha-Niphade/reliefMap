import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';

interface DisasterModeContextType {
  isDisasterMode: boolean;
  toggleDisasterMode: () => void;
  config: any;
}

const DisasterModeContext = createContext<DisasterModeContextType | undefined>(undefined);

// Haversine formula to calculate distance in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // meters
};

export const DisasterModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<any>(null);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isDisasterMode, setIsDisasterMode] = useState(false);

  // 1. Listen to user location
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Location access denied", err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 2. Listen to Firestore Global Config
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'settings', 'disaster_config'), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data());
      }
    });
    return () => unsub();
  }, []);

  // 3. Derive Disaster Mode status based on distance (2km radius)
  useEffect(() => {
    if (!config || !config.active) {
      setIsDisasterMode(false);
      return;
    }

    if (!userCoords || !config.center) {
      // If we don't know location, we default to the global active flag
      setIsDisasterMode(true); 
      return;
    }

    const dist = calculateDistance(
      userCoords.lat, userCoords.lng,
      config.center.lat, config.center.lng
    );

    // If within 2km (2000m) or if no specific radius is set (global override)
    setIsDisasterMode(dist < 2000);
  }, [config, userCoords]);

  useEffect(() => {
    if (isDisasterMode) {
      document.body.classList.add('disaster-theme');
    } else {
      document.body.classList.remove('disaster-theme');
    }
  }, [isDisasterMode]);

  const toggleDisasterMode = async () => {
    if (!db) return;
    const newActive = !config?.active;
    
    // When activating, set current user (Admin) location as the disaster center
    let center = config?.center || { lat: 0, lng: 0 };
    if (newActive && userCoords) {
      center = userCoords;
    }

    try {
      await setDoc(doc(db, 'settings', 'disaster_config'), {
        active: newActive,
        center: center,
        updatedBy: localStorage.getItem('user_id'),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to update disaster mode:", err);
    }
  };

  return (
    <DisasterModeContext.Provider value={{ isDisasterMode, toggleDisasterMode, config }}>
      {children}
    </DisasterModeContext.Provider>
  );
};

export const useDisasterMode = () => {
  const context = useContext(DisasterModeContext);
  if (context === undefined) {
    throw new Error('useDisasterMode must be used within a DisasterModeProvider');
  }
  return context;
};
