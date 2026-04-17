import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { CategoryIcons } from '@/components/RequestCard';
import { AlertTriangle, TrendingUp, MapPin, Clock, Users, ShieldCheck, Info, Activity, AlertCircle, ShieldAlert, BarChart3, Navigation, Plus, MoreHorizontal, Globe } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { useUserMap } from '@/hooks/useUserMap';
import { CrisisHeatMap } from '@/components/CrisisHeatMap';
import { motion, AnimatePresence } from 'framer-motion';
import { useDisasterMode } from '@/context/DisasterModeContext';

function AdminPage() {
  const { isDisasterMode, toggleDisasterMode } = useDisasterMode();
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
      const liveData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setRequests(liveData);
      
      const completed = liveData.filter(p => ['completed', 'resolved'].includes((p.status || '').toLowerCase())).length;
      let totalMins = 0;
      let respCount = 0;
      liveData.forEach((p: any) => {
        if (p.createdAt && p.acceptedAt) {
          const start = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
          const end = p.acceptedAt.toDate ? p.acceptedAt.toDate() : new Date(p.acceptedAt);
          const cTime = start.getTime();
          const aTime = end.getTime();
          if (!isNaN(cTime) && !isNaN(aTime)) {
            totalMins += Math.abs(aTime - cTime) / 60000;
            respCount++;
          }
        }
      });
      const avgStr = respCount > 0 ? (totalMins / respCount).toFixed(1) + ' min' : '—';
      setStats({ totalHelped: completed, avgResponseTime: avgStr });
    });
    
    const unSubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setHelpers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  const criticalRequests = requests
    .filter(r => (r.urgency || '').toLowerCase() === 'critical' && (r.status || '').toLowerCase() !== 'escalated' && !['completed', 'resolved'].includes((r.status||'').toLowerCase()))
    .sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const tB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return tB.getTime() - tA.getTime();
    });
  
  const unresolvedQueue = requests.filter(r => {
     if (r.status !== 'Requested' || !r.createdAt) return false;
     const time = r.createdAt.toDate ? r.createdAt.toDate().getTime() : new Date(r.createdAt).getTime();
     const mins = (now - time) / 60000;
     return mins >= 2;
  }).sort((a, b) => {
    const tA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const tB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return tA.getTime() - tB.getTime();
  });

  const activeHelpers = helpers.filter(h => h.isAvailable);

  const getElapsedString = (createdAt: any) => {
    if (!createdAt) return '0m';
    const time = createdAt.toDate ? createdAt.toDate().getTime() : new Date(createdAt).getTime();
    const mins = Math.max(0, (now - time) / 60000);
    if (mins < 1) return '< 1m';
    return Math.floor(mins) + 'm ' + Math.floor((mins % 1) * 60) + 's';
  };

  const getEscalationStatus = (createdAt: string) => {
    if (!createdAt) return { text: 'Standard', color: 'text-muted-foreground' };
    const time = (createdAt as any).toDate ? (createdAt as any).toDate().getTime() : new Date(createdAt).getTime();
    const mins = (now - time) / 60000;
    if (mins >= 10) return { text: '🚨 CRITICAL ESCALATION', color: 'text-destructive font-black animate-pulse' };
    if (mins >= 5) return { text: 'Admin Priority', color: 'text-sos font-black' };
    if (mins >= 2) return { text: 'Wider Radius Alerted', color: 'text-warning font-bold' };
    return { text: 'Normal Priority', color: 'text-info font-bold' };
  };

  const handleDispatch = async (requestId: string) => {
    if (!db) return;
    try {
      const postRef = doc(db, 'posts', requestId);
      await updateDoc(postRef, {
        status: 'escalated',
        adminHandled: true,
        dispatchedAt: new Date().toISOString()
      });
      alert("Emergency officially escalated to professional responder network.");
    } catch (err) {
      console.error(err);
      alert("Failed to initiate professional dispatch.");
    }
  };

  // Mode-Aware Data Filtering for Statistics
  const filteredRequests = requests.filter(r => {
    const disasterCats = ['flood', 'earthquake', 'landslide', 'storm', 'supply', 'rescue'];
    const isDisasterCat = disasterCats.includes((r.category || '').toLowerCase());
    return isDisasterMode ? isDisasterCat : !isDisasterCat;
  });

  const filteredHelpers = helpers.filter(h => h.isAvailable);
  const modeResolvedCount = filteredRequests.filter(p => ['completed', 'resolved'].includes((p.status || '').toLowerCase())).length;

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-10 space-y-10">
        
        {/* ── HEADER PANEL ───────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8 relative overflow-hidden">
          {isDisasterMode && (
            <div className="absolute top-0 right-0 w-full h-1 bg-blue-600 animate-pulse" />
          )}
          <div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter flex items-center gap-4">
              {isDisasterMode ? 'DISASTER' : 'COMMAND'} <span className={`px-4 py-1 ${isDisasterMode ? 'bg-blue-600' : 'bg-sos'} text-white rounded-xl text-xl lg:text-2xl transition-colors duration-500 uppercase`}>
                {isDisasterMode ? 'TERMINAL' : 'CENTRE'}
              </span>
            </h1>
            <p className="text-sm lg:text-base text-muted-foreground font-medium mt-3 flex items-center gap-2">
              <ShieldAlert className={`w-5 h-5 ${isDisasterMode ? 'text-blue-600' : 'text-sos'}`} /> 
              {isDisasterMode ? 'Active Crisis Management & Relief Terminal' : 'Government & Humanitarian Monitoring Terminal'}
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
             {/* REGIONAL CRISIS TOGGLE */}
             <div className="flex items-center gap-4 bg-secondary/30 p-2 pl-6 rounded-2xl border border-border/50 shadow-inner">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Operational Mode</span>
                  <span className={`text-[11px] font-bold ${isDisasterMode ? 'text-blue-600' : 'text-success'}`}>
                    {isDisasterMode ? 'NATURAL DISASTER ACTIVE' : 'STANDARD PROTOCOL'}
                  </span>
                </div>
                <button 
                  onClick={toggleDisasterMode}
                  className={`relative w-16 h-8 rounded-full transition-all duration-500 p-1 ${isDisasterMode ? 'bg-blue-600' : 'bg-success'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-500 ${isDisasterMode ? 'translate-x-8' : 'translate-x-0'}`} />
                </button>
             </div>

             <div className="flex items-center gap-4">
                <div className="px-5 py-2.5 rounded-full bg-secondary/50 border border-border flex items-center gap-2 shadow-sm">
                   <div className={`w-2 h-2 rounded-full ${isDisasterMode ? 'bg-blue-600' : 'bg-success'} animate-pulse`} />
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                     {isDisasterMode ? 'Regional Disaster Sync On' : 'Live Telemetry'}
                   </span>
                </div>
                <button className={`w-10 h-10 rounded-xl ${isDisasterMode ? 'bg-blue-600' : 'bg-primary'} text-white flex items-center justify-center hover:scale-110 shadow-xl transition-all active:scale-95`}>
                  <MoreHorizontal className="w-5 h-5" />
                </button>
             </div>
          </div>
        </div>

        {/* ── KEY METRICS: Dynamic Grid ───────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { icon: Users, label: isDisasterMode ? 'Evacuated' : 'Incidents Resolved', value: modeResolvedCount.toLocaleString(), color: 'text-accent', bg: 'bg-accent/10' },
            { icon: AlertTriangle, label: 'Unresolved', value: criticalRequests.filter(r => isDisasterMode ? ['flood', 'earthquake', 'rescue'].includes(r.category) : !['flood', 'earthquake'].includes(r.category)).length, color: 'text-sos', bg: 'bg-sos/10' },
            { icon: Globe, label: isDisasterMode ? 'Active Hotspots' : 'Regions Managed', value: isDisasterMode ? requests.filter(r => r.urgency === 'Critical' && ['flood', 'earthquake'].includes(r.category)).length : 12, color: isDisasterMode ? 'text-blue-600' : 'text-warning', bg: isDisasterMode ? 'bg-blue-600/10' : 'bg-warning/10' },
            { icon: Clock, label: isDisasterMode ? 'Response Speed' : 'Avg Triage', value: stats.avgResponseTime, color: 'text-info', bg: 'bg-info/10' },
            { icon: ShieldCheck, label: isDisasterMode ? 'Field Rescuers' : 'Online Agents', value: filteredHelpers.length, color: 'text-success', bg: 'bg-success/10' },
          ].map((m, idx) => (
            <motion.div 
              key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
              className="bg-card border border-border rounded-2xl p-5 shadow-sm group hover:border-primary/20 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <p className="text-3xl font-black tracking-tight">{m.value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-2">{m.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── MAIN TERMINAL BODY: Golden Ratio split (8/12 and 4/12 Grid) ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* MAIN COLUMN (8/12 ~ 66%) — Intelligence & Ops */}
          <div className="lg:col-span-8 space-y-10">
            {/* Heat Map Section (Native Card inside Component) */}
            <CrisisHeatMap requests={requests} helpers={helpers} />

            {/* Critical Triage Queue */}
            <div className="bg-card border border-sos/30 rounded-3xl overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-sos animate-pulse" />
              <div className="p-6 md:p-8 border-b border-sos/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-sos/10 flex items-center justify-center text-sos shadow-inner">
                     <AlertTriangle className="w-6 h-6 animate-pulse" />
                   </div>
                   <div>
                     <h2 className="text-2xl font-black tracking-tight">Active Criticals</h2>
                     <p className="text-sm text-muted-foreground font-medium">Highest priority dispatch queue</p>
                   </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="bg-sos text-white text-[11px] font-black px-5 py-2 rounded-full tracking-widest uppercase shadow-lg shadow-sos/30">
                    {criticalRequests.length} ALERTS
                  </span>
                </div>
              </div>
              <div className="p-6 md:p-10 space-y-6 max-h-[650px] overflow-y-auto no-scrollbar">
                <AnimatePresence mode="popLayout">
                  {criticalRequests.map(r => (
                    <motion.div 
                      key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="p-6 rounded-[2rem] bg-sos/[0.03] border border-sos/10 flex flex-col md:flex-row items-center gap-8 group hover:bg-sos/[0.07] transition-all"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center shrink-0 border-2 border-sos/20 group-hover:rotate-12 transition-transform shadow-xl">
                        {(() => {
                           const CatIcon = CategoryIcons[(r.category || '').toLowerCase()] || Info;
                           return <CatIcon className="w-7 h-7 text-sos" />;
                        })()}
                      </div>
                      <div className="flex-1 text-center md:text-left min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                           <h4 className="text-lg font-black tracking-tight truncate">{getUserName(r.userId, r.category)}</h4>
                           <div className="flex items-center gap-3 justify-center">
                             <div className="px-3 py-1 bg-card rounded-xl border border-sos/20 text-sos shadow-sm flex items-center gap-2">
                               <Clock className="w-3.5 h-3.5" /> 
                               <span className="text-xs font-black font-mono">{getElapsedString(r.createdAt)}</span>
                             </div>
                             {r.offlineMode && <span className="text-[10px] font-black bg-destructive text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-destructive/20 animate-pulse">SMS</span>}
                           </div>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed line-clamp-2">{r.description}</p>
                        <div className="mt-6 flex items-center justify-center md:justify-start gap-6">
                           <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${getEscalationStatus(r.createdAt).color}`}>
                             <Activity className="w-4 h-4" /> {getEscalationStatus(r.createdAt).text}
                           </p>
                           <div className="hidden md:block flex-1 h-px bg-sos/10" />
                           <button 
                             onClick={() => handleDispatch(r.id)}
                             disabled={(r.status || '').toLowerCase() === 'escalated'}
                             className="px-8 py-3 rounded-2xl bg-sos text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-sos/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                           >
                             {(r.status || '').toLowerCase() === 'escalated' ? 'DISPATCHED' : 'DISPATCH'}
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {criticalRequests.length === 0 && (
                    <div className="text-center py-20 opacity-30">
                      <ShieldCheck className="w-20 h-20 mx-auto mb-6" />
                      <p className="font-black text-2xl tracking-tight">System Secure</p>
                      <p className="text-sm font-medium">No critical threats currently active.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* SIDE COLUMN (4/12 ~ 33%) — Insights & Triage */}
          <div className="lg:col-span-4 space-y-10">
            
            {/* Categorical Pulse */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                   <BarChart3 className="w-5 h-5" />
                 </div>
                 <h2 className="text-xl font-black tracking-tight">Insights</h2>
              </div>
              
              <div className="space-y-8">
                {Object.entries(categoryCount).map(([cat, count]) => {
                  const CatIcon = CategoryIcons[cat.toLowerCase()] || Info;
                  const percentage = ((count as number) / (requests.length || 1)) * 100;
                  return (
                    <div key={cat} className="space-y-3 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CatIcon className="w-5 h-5 text-primary group-hover:scale-125 transition-transform" />
                          <span className="text-xs font-black uppercase tracking-tight text-muted-foreground capitalize">{cat.replace('_', ' ')}</span>
                        </div>
                        <span className="text-base font-black">{count as number}</span>
                      </div>
                      <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden p-0.5 shadow-inner">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Breakdown Circle-pills */}
              <div className="pt-6 flex flex-wrap gap-2.5">
                {Object.entries(statusCount).map(([st, cnt]) => {
                  const colors: Record<string, string> = { requested: 'bg-pending', accepted: 'bg-accepted', on_way: 'bg-on-way', completed: 'bg-completed', escalated: 'bg-escalated' };
                  return (
                    <div key={st} className="px-4 py-2 rounded-2xl border border-border/50 bg-secondary/30 flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${colors[st.toLowerCase()] || 'bg-border'}`} />
                      <span className="text-[10px] font-black uppercase tracking-tight opacity-70">{st.replace('_', ' ')}: {cnt as number}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* High-Stagnation Queue (> 2m) */}
            <div className="bg-card border border-warning/30 rounded-[3rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center text-warning">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-warning-foreground">Stagnation</h2>
                  </div>
                  <span className="w-10 h-10 rounded-2xl bg-warning/20 border border-warning/30 text-warning flex items-center justify-center text-sm font-black shadow-lg">
                     {unresolvedQueue.length}
                  </span>
                </div>
                <div className="space-y-4 max-h-[350px] overflow-y-auto no-scrollbar pr-1">
                  {unresolvedQueue.map(r => (
                    <div key={r.id} className="p-5 rounded-[2rem] bg-secondary/40 border border-border flex items-center justify-between gap-6 group hover:border-warning/30 transition-all cursor-crosshair">
                       <div className="flex flex-col gap-1.5 min-w-0">
                         <p className="text-xs font-black truncate group-hover:text-warning transition-colors">{r.description}</p>
                         <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3 text-primary" /> NODE_{r.id.slice(0, 4)}</p>
                       </div>
                       <span className="px-3 py-1.5 rounded-xl bg-background text-[11px] font-black text-warning border border-warning/20 font-mono shadow-sm">
                         {getElapsedString(r.createdAt)}
                       </span>
                    </div>
                  ))}
                  {unresolvedQueue.length === 0 && <p className="text-xs text-center text-muted-foreground py-10 font-bold opacity-50">Response SLA at 100%.</p>}
                </div>
            </div>

            {/* Personnel Deployment */}
            <div className="bg-card border border-border rounded-[3rem] p-8 shadow-sm">
                 <div className="flex items-center gap-4 mb-10">
                   <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success">
                     <ShieldCheck className="w-6 h-6" />
                   </div>
                   <h2 className="text-2xl font-black tracking-tight">Deployment</h2>
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    {activeHelpers.slice(0, 5).map(h => (
                      <div key={h.id} className="flex items-center justify-between p-5 rounded-[2rem] bg-secondary/40 border border-border/50 group hover:border-success/30 hover:bg-success/[0.02] transition-all">
                        <div className="flex items-center gap-4 overflow-hidden">
                           <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-tr from-success to-primary text-white flex items-center justify-center text-sm font-black shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                             {(h.name || '?').charAt(0)}
                           </div>
                           <div className="min-w-0">
                              <p className="text-sm font-black truncate">{h.name}</p>
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter truncate max-w-[140px] opacity-70">{h.skills?.slice(0, 2).join(' · ')}</p>
                           </div>
                        </div>
                        <button className="w-10 h-10 rounded-2xl bg-background border border-border/50 flex items-center justify-center hover:bg-success hover:text-white transition-all shadow-sm active:scale-90">
                          <Navigation className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    ))}
                    {activeHelpers.length > 5 && (
                      <button className="py-4 rounded-[2rem] border-2 border-dashed border-border text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-secondary/40 transition-colors">
                        View {activeHelpers.length - 5} More Available
                      </button>
                    )}
                 </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-border/40 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">© ReliefMap Command Terminal · Priority Response Protocol</p>
        </div>
      </div>
    </AppLayout>
  );
}

export default AdminPage;
