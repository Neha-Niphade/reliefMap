import { useEffect, useState } from 'react';
import { Users, Activity, CheckCircle, Clock, Shield, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export function StatsBar() {
  const [stats, setStats] = useState({
    activeRequests: 0,
    criticalActive: 0,
    completedToday: 0,
    helpersOnline: 0,
    totalHelped: 0,
    avgResponseTime: '0 min'
  });

  useEffect(() => {
    if (!db) return;
    
    const unSubPosts = onSnapshot(query(collection(db, 'posts')), (snapshot) => {
      const posts = snapshot.docs.map(doc => doc.data());
      const completed = posts.filter(p => ['completed', 'resolved'].includes((p.status || '').toLowerCase())).length;
      
      let totalMins = 0;
      let respCount = 0;
      posts.forEach(p => {
        if (p.createdAt && p.acceptedAt) {
          const cTime = new Date(p.createdAt).getTime();
          const aTime = new Date(p.acceptedAt).getTime();
          if (!isNaN(cTime) && !isNaN(aTime)) {
            const diff = Math.abs(aTime - cTime) / 60000;
            totalMins += diff;
            respCount++;
          }
        }
      });
      const avgStr = respCount > 0 ? (totalMins / respCount).toFixed(1) + ' min' : '0 min';
      
      setStats(prev => ({
        ...prev,
        activeRequests: posts.filter(p => !['completed', 'resolved'].includes((p.status || '').toLowerCase())).length,
        criticalActive: posts.filter(p => (p.urgency || '').toLowerCase() === 'critical' && !['completed', 'resolved'].includes((p.status || '').toLowerCase())).length,
        completedToday: completed,
        totalHelped: completed,
        avgResponseTime: avgStr
      }));
    });

    const unSubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data());
      setStats(prev => ({
        ...prev,
        helpersOnline: users.filter(u => u.isAvailable === true).length
      }));
    });

    return () => { unSubPosts(); unSubUsers(); };
  }, []);

  const displayStats = [
    { icon: Users, label: 'People Helped', value: stats.totalHelped.toLocaleString(), color: 'text-accent' },
    { icon: Activity, label: 'Active Now', value: stats.activeRequests, color: 'text-warning' },
    { icon: CheckCircle, label: 'Completed Today', value: stats.completedToday, color: 'text-success' },
    { icon: Clock, label: 'Avg Response', value: stats.avgResponseTime, color: 'text-info' },
    { icon: Shield, label: 'Helpers Online', value: stats.helpersOnline, color: 'text-accent' },
    { icon: AlertTriangle, label: 'Critical', value: stats.criticalActive, color: 'text-sos' },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
      {displayStats.map(s => (
        <div key={s.label} className="bg-secondary/50 rounded-xl p-3 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <s.icon className={`w-4 h-4 ${s.color}`} />
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
          <p className="font-display font-bold text-lg">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
