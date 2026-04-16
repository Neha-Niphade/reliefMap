import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { CategoryIcons } from '@/components/RequestCard';
import { AlertTriangle, TrendingUp, MapPin, Clock, Users, ShieldCheck, Info, Activity, AlertCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { useUserMap } from '@/hooks/useUserMap';
import { CrisisHeatMap } from '@/components/CrisisHeatMap';

function AdminPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [helpers, setHelpers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalHelped: 0, 
    avgResponseTime: '0 min'
  });
  const [now, setNow] = useState(Date.now());
  const { getUserName } = useUserMap();

  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (!db) return;
    const qPosts = query(collection(db, 'posts'));
    const unSubPosts = onSnapshot(qPosts, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(liveData);
      
      const completed = liveData.filter(p => ['completed', 'resolved'].includes((p.status || '').toLowerCase())).length;
      let totalMins = 0;
      let respCount = 0;
      liveData.forEach((p: any) => {
        if (p.createdAt && p.acceptedAt) {
          const cTime = new Date(p.createdAt).getTime();
          const aTime = new Date(p.acceptedAt).getTime();
          if (!isNaN(cTime) && !isNaN(aTime)) {
            totalMins += Math.abs(aTime - cTime) / 60000;
            respCount++;
          }
        }
      });
      const avgStr = respCount > 0 ? (totalMins / respCount).toFixed(1) + ' min' : '0 min';
      
      setStats({ totalHelped: completed, avgResponseTime: avgStr });
    });
    
    const qUsers = query(collection(db, 'users'));
    const unSubUsers = onSnapshot(qUsers, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHelpers(liveData);
    });
    
    return () => { unSubPosts(); unSubUsers(); };
  }, []);

  const categoryCount = requests.reduce((acc, r) => {
    const cat = r.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusCount = requests.reduce((acc, r) => {
    const st = r.status || 'requested';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const criticalRequests = requests.filter(r => (r.urgency || '').toLowerCase() === 'critical');
  
  // Unresolved queue (anything requested for more than 2 mins)
  const unresolvedQueue = requests.filter(r => {
     if (r.status !== 'Requested' || !r.createdAt) return false;
     const mins = (now - new Date(r.createdAt).getTime()) / 60000;
     return mins >= 2;
  }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const activeHelpers = helpers.filter(h => h.isAvailable);

  const getElapsedString = (createdAt: string) => {
    if (!createdAt) return '0m';
    const mins = Math.max(0, (now - new Date(createdAt).getTime()) / 60000);
    if (mins < 1) return '< 1m';
    return Math.floor(mins) + 'm ' + Math.floor((mins % 1) * 60) + 's';
  };

  const getEscalationStatus = (createdAt: string) => {
    if (!createdAt) return { text: 'Standard', color: 'text-muted-foreground' };
    const mins = (now - new Date(createdAt).getTime()) / 60000;
    if (mins >= 10) return { text: '🚨 ESPCALATION', color: 'text-destructive font-bold animate-pulse' };
    if (mins >= 5) return { text: 'Admin Notified', color: 'text-sos font-bold' };
    if (mins >= 2) return { text: 'Wider Radius Alerted', color: 'text-warning' };
    return { text: 'Standard Priority', color: 'text-info' };
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Government & NGO Monitoring Panel</p>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total Helped', value: stats.totalHelped.toLocaleString(), color: 'text-accent', bg: 'bg-accent/10' },
            { icon: AlertTriangle, label: 'Critical Active', value: criticalRequests.length, color: 'text-sos', bg: 'bg-sos/10' },
            { icon: Clock, label: 'Avg Response', value: stats.avgResponseTime, color: 'text-info', bg: 'bg-info/10' },
            { icon: ShieldCheck, label: 'Helpers Online', value: activeHelpers.length, color: 'text-success', bg: 'bg-success/10' },
          ].map(m => (
            <div key={m.label} className="bg-card border border-border rounded-xl p-5">
              <div className={`w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center mb-3`}>
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <p className="text-2xl font-display font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Live Crisis Heat Map - Full Width Container */}
        <div className="w-full">
          <CrisisHeatMap requests={requests} helpers={helpers} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Crisis Zone Heatmap Indicator */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-warning" />
              <h3 className="font-display font-bold">Crisis Zones</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(categoryCount).map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <div className="w-8 flex justify-center">
                    {(() => {
                      const CatIcon = CategoryIcons[cat.toLowerCase()] || Info;
                      return <CatIcon className="w-5 h-5 text-muted-foreground" />;
                    })()}
                  </div>
                  <span className="text-sm flex-1 capitalize">{cat.replace('_', ' ')}</span>
                  <div className="flex-1 bg-secondary rounded-full h-2">
                    <div
                      className="h-2 rounded-full gradient-emergency"
                      style={{ width: `${(count / (requests.length || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status breakdown */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-info" />
              <h3 className="font-display font-bold">Request Status</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(statusCount).map(([status, count]) => {
                const colors: Record<string, string> = {
                  requested: 'bg-pending', accepted: 'bg-accepted', on_way: 'bg-on-way',
                  completed: 'bg-completed', escalated: 'bg-escalated',
                };
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors[status.toLowerCase()] || 'bg-border'}`} />
                    <span className="text-sm flex-1 capitalize">{status.replace('_', ' ')}</span>
                    <span className="text-sm font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical alerts */}
          <div className="bg-card border border-sos/50 rounded-xl p-5 space-y-4 shadow-[0_0_15px_rgba(220,38,38,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-sos animate-pulse" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-sos animate-pulse" />
                <h3 className="font-display font-bold text-sos">Action Required: Critical</h3>
              </div>
              <span className="bg-sos/10 text-sos px-2 py-0.5 rounded-full text-xs font-bold">{criticalRequests.length}</span>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {criticalRequests.map(r => (
                <div key={r.id} className="p-3 rounded-lg bg-sos/5 border border-sos/30 flex flex-col gap-2 relative overflow-hidden group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      {(() => {
                        const CatIcon = CategoryIcons[(r.category || '').toLowerCase()] || Info;
                        return <CatIcon className="w-5 h-5 text-destructive" />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold truncate">{getUserName(r.userId, r.category)}</p>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-mono font-bold bg-background px-1.5 rounded text-sos border border-sos/20">
                             {getElapsedString(r.createdAt)}
                          </span>
                          {r.offlineMode && (
                            <span className="text-[8px] font-black text-destructive uppercase tracking-tighter bg-destructive/10 px-1.5 rounded">
                               SMS Fallback
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{r.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-sos/10">
                    <span className={`text-[10px] uppercase tracking-wider ${getEscalationStatus(r.createdAt).color}`}>
                      {getEscalationStatus(r.createdAt).text}
                    </span>
                    <button className="text-xs bg-sos text-white px-3 py-1 rounded shadow-sm hover:bg-sos/80 transition font-bold tracking-wide">
                      DISPATCH
                    </button>
                  </div>
                </div>
              ))}
              {criticalRequests.length === 0 && (
                <div className="text-center py-6 text-muted-foreground opacity-60">
                   <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                   <p className="text-sm font-medium">No critical emergencies.</p>
                </div>
              )}
            </div>
          </div>

          {/* Unresolved Queue */}
          <div className="bg-card border border-warning/30 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                <h3 className="font-display font-bold">Unresolved Queue (&gt; 2m)</h3>
              </div>
              <span className="bg-warning/10 text-warning px-2 py-0.5 rounded-full text-xs font-bold">{unresolvedQueue.length}</span>
            </div>
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {unresolvedQueue.map(r => (
                <div key={r.id} className="p-2.5 rounded-lg bg-secondary/50 border border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <AlertCircle className={`w-4 h-4 shrink-0 ${(r.urgency||'').toLowerCase() === 'high' ? 'text-warning' : 'text-info'}`} />
                    <p className="text-xs font-medium truncate">{r.description}</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-background px-1.5 rounded whitespace-nowrap">
                    {getElapsedString(r.createdAt)}
                  </span>
                </div>
              ))}
              {unresolvedQueue.length === 0 && (
                <p className="text-xs text-center text-muted-foreground py-4">All requests accepted promptly.</p>
              )}
            </div>
          </div>

          {/* Active helpers */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              <h3 className="font-display font-bold">Active Helpers</h3>
            </div>
            <div className="space-y-2">
              {activeHelpers.map(h => (
                <div key={h.id} className="p-3 rounded-lg bg-success/5 border border-success/20 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full gradient-safe flex items-center justify-center text-xs font-bold text-success-foreground">
                    {(h.name || '?').split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{h.name}</p>
                    {h.skills && <p className="text-xs text-muted-foreground">{h.skills.join(' · ')}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default AdminPage;
