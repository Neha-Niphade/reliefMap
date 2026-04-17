import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { EmergencyMap } from '@/components/EmergencyMap';
import { RequestCard } from '@/components/RequestCard';
import { HelperToggle } from '@/components/HelperToggle';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Activity, CheckCircle, Clock, Shield, AlertTriangle, Users, Globe, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDisasterMode } from '@/context/DisasterModeContext';

// Golden Ratio: φ = 1.618  →  map = 61.8%, sidebar = 38.2%

function StatPill({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/70 border border-border/60 text-xs"
    >
      <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold font-display text-foreground">{value}</span>
    </motion.div>
  );
}

const Dashboard = () => {
  const { isDisasterMode, toggleDisasterMode } = useDisasterMode();
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({
    active: 0, critical: 0, completed: 0, helpers: 0, avgResponse: '—'
  });

  useEffect(() => {
    if (!db) return;

    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc')), (snap) => {
      const posts = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setRequests(posts);

      const active = posts.filter(p => !['completed','resolved'].includes((p.status||'').toLowerCase())).length;
      const critical = posts.filter(p => (p.urgency||'').toLowerCase() === 'critical' && !['completed','resolved'].includes((p.status||'').toLowerCase())).length;
      const completed = posts.filter(p => ['completed','resolved'].includes((p.status||'').toLowerCase())).length;

      let mins = 0, cnt = 0;
      posts.forEach(p => {
        if (p.createdAt && p.acceptedAt) {
          const start = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
          const end = p.acceptedAt.toDate ? p.acceptedAt.toDate() : new Date(p.acceptedAt);
          const d = (end.getTime() - start.getTime()) / 60000;
          if (!isNaN(d)) { mins += d; cnt++; }
        }
      });

      setStats(prev => ({ ...prev, active, critical, completed, avgResponse: cnt > 0 ? (mins/cnt).toFixed(1)+'m' : '—' }));
    });

    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snap) => {
      const helpers = snap.docs.filter(d => d.data().isAvailable === true).length;
      setStats(prev => ({ ...prev, helpers }));
    });

    return () => { unsubPosts(); unsubUsers(); };
  }, []);

  // Only show active (non-completed) requests in the sidebar
  const activeRequests = requests.filter(p => !['completed', 'resolved'].includes((p.status || '').toLowerCase()));

  // Sort: Absolute Latest First (Regardless of urgency)
  const sorted = [...activeRequests].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  const statPills = [
    { icon: isDisasterMode ? Globe : Activity, label: isDisasterMode ? 'Crisis Points' : 'Active',     value: stats.active,       color: isDisasterMode ? 'text-blue-600' : 'text-warning' },
    { icon: AlertTriangle, label: 'Critical',   value: stats.critical,     color: 'text-sos' },
    { icon: CheckCircle,   label: 'Resolved',   value: stats.completed,    color: 'text-success' },
    { icon: Shield,        label: 'Helpers',    value: stats.helpers,      color: 'text-accent' },
    { icon: Clock,         label: 'Avg resp.',  value: stats.avgResponse,  color: 'text-info' },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col h-full min-h-0 gap-0">

        {/* ── Mode Switcher Card (Prominent) ────────────────────────── */}
        <div className="px-4 pt-4 shrink-0">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDisasterMode ? 'bg-blue-600 text-white' : 'bg-primary text-white'} shadow-lg transition-colors duration-500`}>
                {isDisasterMode ? <Globe className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tighter uppercase italic">
                  Incident <span className={isDisasterMode ? 'text-blue-600' : 'text-primary'}>Context</span>
                </h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-70">
                  {isDisasterMode ? 'Community-wide Crisis Protocol' : 'Standard Emergency Operations'}
                </p>
              </div>
            </div>

            <div className={`px-5 p-2 rounded-2xl border ${isDisasterMode ? 'bg-blue-600/10 border-blue-600/30 text-blue-600' : 'bg-success/10 border-success/30 text-success'} flex items-center gap-3 transition-colors duration-500`}>
              <div className={`w-2 h-2 rounded-full ${isDisasterMode ? 'bg-blue-600' : 'bg-success'} animate-pulse`} />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                {isDisasterMode ? 'Regional Crisis Sync Active' : 'Normal Operations Synchronized'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Disaster Alert Banner ────────────────────────── */}
        <AnimatePresence>
          {isDisasterMode && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 animate-spin-slow" />
                <span className="text-xs font-black uppercase tracking-widest">Natural Disaster Intelligence Active</span>
              </div>
              <div className="flex items-center gap-4">
                 <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Flood Warning Level: High</span>
                 <Info className="w-4 h-4 opacity-70 cursor-pointer" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats strip (compact, non-intrusive) ────────────────────────── */}
        <div className={`shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border/40 ${isDisasterMode ? 'bg-blue-600/5' : 'bg-background/60'} backdrop-blur-sm overflow-x-auto no-scrollbar`}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 shrink-0 mr-1">Live</span>
          {statPills.map(s => <StatPill key={s.label} {...s} />)}
        </div>

        {/* ── Golden Ratio body: map φ=61.8%  |  panel φ=38.2% ────────────── */}
        <div className="flex-1 flex min-h-0 phi-grid-cols gap-0">

          {/* MAP — the primary focus (61.8%) */}
          <div className="min-h-0 p-3 pr-1.5">
            <div className="w-full h-full rounded-2xl overflow-hidden border border-border shadow-sm">
              <EmergencyMap />
            </div>
          </div>

          {/* SIDEBAR — requests + helper toggle (38.2%) */}
          <div className="flex flex-col min-h-0 border-l border-border/40 bg-card/40">

            {/* Helper toggle */}
            <div className="shrink-0 p-3 pb-0">
              <HelperToggle />
            </div>

            {/* Section header */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-2">
              <h2 className="font-display font-bold text-sm tracking-tight">{isDisasterMode ? 'Community Relief Efforts' : 'Nearby Requests'}</h2>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {activeRequests.length} active
              </span>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-0">
              {sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
                  <Users className="w-8 h-8 opacity-20" />
                  <p>No active requests nearby</p>
                </div>
              ) : sorted.map(r => <RequestCard key={r.id} request={r} />)}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
