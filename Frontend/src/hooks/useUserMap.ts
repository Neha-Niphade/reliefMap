import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export function useUserMap() {
  const [userMap, setUserMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'users'));
    const unSub = onSnapshot(q, (snapshot) => {
      const map: Record<string, any> = {};
      snapshot.docs.forEach(doc => {
        map[doc.id] = { id: doc.id, ...doc.data() };
      });
      setUserMap(map);
    });
    return () => unSub();
  }, []);

  const getUserName = (userId: string, category?: string) => {
    if (!userId) return 'Anonymous User';
    const user = userMap[userId];
    
    // Privacy / anonymous fallback
    if (user?.isAnonymous) {
       if (category === 'women_safety' || user.gender === 'female') return 'Anonymous Woman';
       if (category === 'elderly' || user.type === 'senior') return 'Anonymous Senior';
       return 'Anonymous User';
    }

    if (!user) return userId; 
    
    if (user.name) return user.name;
    if (user.first_name || user.last_name) return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    if (user.username) return user.username;
    
    return 'Anonymous User'; // Fallback
  };

  return { userMap, getUserName };
}
