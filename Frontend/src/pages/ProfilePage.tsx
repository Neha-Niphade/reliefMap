import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User, Phone, Mail, ShieldAlert, Award, FileText, CheckCircle, Edit3, Save, MapPin, Calendar, Heart, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ phone: '', gender: '', bio: '', skills: '' });
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    if (!userId || !db) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', userId));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfile(data);
          setFormData({
            phone: data.phone || '',
            gender: data.gender || '',
            bio: data.bio || '',
            skills: data.skills ? data.skills.join(', ') : '',
          });
        }

        const reqQuery = query(collection(db, 'posts'), where('userId', '==', userId));
        const helpQuery = query(collection(db, 'posts'), where('helperId', '==', userId));
        
        const [reqSnap, helpSnap] = await Promise.all([getDocs(reqQuery), getDocs(helpQuery)]);
        const combined = [
          ...reqSnap.docs.map(d => ({ id: d.id, _role: 'Requester', ...d.data() })),
          ...helpSnap.docs.map(d => ({ id: d.id, _role: 'Helper', ...d.data() }))
        ];
        
        combined.sort((a: any, b: any) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const tB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return tB.getTime() - tA.getTime();
        });
        setHistory(combined);

      } catch (err) {
        console.error("Error fetching profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const handleSave = async () => {
    if (!userId || !db) return;
    try {
      const parsedSkills = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      await updateDoc(doc(db, 'users', userId), {
        phone: formData.phone,
        gender: formData.gender,
        bio: formData.bio,
        skills: parsedSkills
      });
      setProfile({ ...profile, phone: formData.phone, gender: formData.gender, bio: formData.bio, skills: parsedSkills });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  if (!userId) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Please log in to view your profile.</p>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-bold text-muted-foreground animate-pulse">Syncing Profile...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const timesHelped = history.filter(h => h._role === 'Helper' && ['completed', 'resolved'].includes((h.status||'').toLowerCase())).length;
  const timesRequested = history.filter(h => h._role === 'Requester').length;

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto p-4 md:p-8">
        
        {/* ── PROFILE HEADER: Golden Ratio Split (Top Section) ───────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative bg-card border border-border rounded-[2rem] overflow-hidden shadow-xl mb-8 group"
        >
          {/* Abstract background elements */}
          <div className="absolute top-0 right-0 w-[40%] h-full bg-primary/5 -skew-x-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />

          <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
              {/* Profile Avatar */}
              <div className="relative">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-gradient-to-tr from-primary to-accent p-1 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <div className="w-full h-full rounded-[2.3rem] bg-card flex items-center justify-center overflow-hidden">
                    <User className="w-16 h-16 text-primary/40" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-success text-white flex items-center justify-center shadow-lg border-4 border-card">
                  <CheckCircle className="w-5 h-5 fill-white text-success" />
                </div>
              </div>

              <div className="text-center md:text-left space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight">{profile?.name || 'User'}</h1>
                  {profile?.isAvailable && (
                    <span className="hidden md:block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                      Volunteer
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-6 text-sm text-muted-foreground font-medium">
                  <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> {profile?.email}</span>
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Active Member'}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center bg-secondary/50 backdrop-blur-md rounded-3xl p-2 border border-border/50">
              <div className="px-6 py-3 text-center border-r border-border/50">
                <p className="text-2xl font-black text-primary leading-none">{timesHelped}</p>
                <p className="text-[10px] uppercase font-bold tracking-tighter text-muted-foreground mt-1">Lives Impacted</p>
              </div>
              <div className="px-6 py-3 text-center">
                <p className="text-2xl font-black text-destructive leading-none">{timesRequested}</p>
                <p className="text-[10px] uppercase font-bold tracking-tighter text-muted-foreground mt-1">SOS Alerts</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── MAIN BODY: Golden Ratio Column Split (38.2% / 61.8%) ─────────────── */}
        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
          
          {/* SIDEBAR (38.2%) — Identity & Details */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="w-full lg:w-[38.2%] space-y-6"
          >
            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150">
                <ShieldAlert className="w-32 h-32 text-primary" />
              </div>

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight">Identity</h2>
                </div>
                <button 
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center hover:bg-primary hover:text-white transition-all text-muted-foreground group"
                >
                  {isEditing ? <Save className="w-5 h-5" /> : <Edit3 className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact & Gender</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-secondary/40 border border-border/50">
                      <p className="text-[10px] font-bold text-muted-foreground">Phone</p>
                      {isEditing ? (
                        <input className="w-full mt-1 bg-transparent text-sm font-bold focus:outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      ) : (
                        <p className="text-sm font-bold truncate">{profile?.phone || '—'}</p>
                      )}
                    </div>
                    <div className="p-4 rounded-3xl bg-secondary/40 border border-border/50">
                      <p className="text-[10px] font-bold text-muted-foreground">Sex</p>
                      {isEditing ? (
                        <select className="w-full mt-1 bg-transparent text-sm font-bold focus:outline-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                          <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                        </select>
                      ) : (
                        <p className="text-sm font-bold">{profile?.gender || '—'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expertise & Skills</p>
                  <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 min-h-[100px]">
                    {isEditing ? (
                      <textarea className="w-full bg-transparent text-sm font-medium focus:outline-none resize-none h-20" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="e.g. CPR, First Aid, Nurse..." />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {profile?.skills?.length ? profile.skills.map((s: any) => (
                          <span key={s} className="px-3 py-1.5 rounded-xl bg-white dark:bg-card border border-primary/20 text-xs font-bold shadow-sm">{s}</span>
                        )) : <p className="text-xs text-muted-foreground italic">No specialized skills listed.</p>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Medical Conditions / Bio</p>
                  <div className="p-5 rounded-[2rem] bg-secondary/40 border border-border/50">
                    {isEditing ? (
                      <textarea className="w-full bg-transparent text-sm font-medium focus:outline-none resize-none h-28" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Shared with responders during SOS..." />
                    ) : (
                      <p className="text-sm font-medium leading-relaxed italic">{profile?.bio || "Help responders by listing allergies, blood group, or conditions."}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contribution Progress */}
            <div className="p-8 bg-gradient-to-br from-primary to-accent rounded-[2.5rem] text-white shadow-lg overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black uppercase tracking-tight">Citizen Rank</h3>
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                    <span>Community Hero</span>
                    <span>{Math.min(100, (timesHelped * 10))}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden p-0.5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (timesHelped * 10))}%` }} className="h-full bg-white rounded-full" />
                  </div>
                  <p className="text-[10px] opacity-80 text-center font-bold">Rescuing others unlocks higher trust tiers.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* MAIN CONTENT (61.8%) — History Ledger */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="w-full lg:w-[61.8%] bg-card border border-border rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Emergency History</h2>
                  <p className="text-xs text-muted-foreground font-medium">Detailed record of your SOS & Rescue activity</p>
                </div>
              </div>
              <div className="flex gap-2">
                 <span className="px-4 py-1.5 rounded-full bg-secondary text-[10px] font-black uppercase tracking-widest">{history.length} Logs</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 max-h-[800px] no-scrollbar">
              <AnimatePresence mode="popLayout">
                {history.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Heart className="w-12 h-12 mb-4 opacity-10" />
                    <p className="font-bold">No history recorded yet.</p>
                  </motion.div>
                ) : history.map((item, idx) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative p-6 rounded-[2rem] bg-secondary/30 border border-border hover:border-primary/30 transition-all flex flex-col md:flex-row gap-6"
                  >
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item._role === 'Helper' ? 'bg-primary text-white' : 'bg-destructive text-white'}`}>
                          {item._role === 'Helper' ? 'Rescuer' : 'Requested Help'}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {item.createdAt ? (item.createdAt.toDate ? item.createdAt.toDate().toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()) : 'Unknown'}
                        </span>
                        <span className={`ml-auto w-2 h-2 rounded-full ${(item.status||'').toLowerCase() === 'completed' ? 'bg-success' : 'bg-warning'} group-hover:scale-150 transition-transform`} />
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-base font-bold text-foreground leading-snug">{item.description}</p>
                        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground pt-1">
                          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> {item.location?.lat?.toFixed(3)} , {item.location?.lng?.toFixed(3)}</span>
                          <span className="flex items-center gap-1.5 capitalize font-bold text-foreground"><div className="w-1 h-1 rounded-full bg-border" /> Status: {item.status || 'requested'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-56 p-5 rounded-3xl bg-card border border-border/50 flex flex-col justify-center gap-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Connection</p>
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border">
                           <User className="w-5 h-5 text-muted-foreground" />
                         </div>
                         <div className="min-w-0">
                           <p className="text-xs font-black truncate">{item._role === 'Requester' ? (item.helperId ? "Assigned Rescuer" : "Finding Helper") : "Citizen in Need"}</p>
                           <p className="text-[10px] text-muted-foreground font-mono truncate">{item._role === 'Requester' ? (item.helperId || "—") : (item.userId || "—")}</p>
                         </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <div className="p-6 bg-secondary/40 border-t border-border/50 text-center">
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">© ReliefMap · Trustworthy Hyperlocal Response</p>
            </div>
          </motion.div>
        </div>
        
      </div>
    </AppLayout>
  );
}
