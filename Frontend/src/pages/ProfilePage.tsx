import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User, Phone, Mail, ShieldAlert, Award, FileText, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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
        // Load User Profile
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

        // Load History (Both requested and helped)
        // Note: Firestore requires composite indexes for OR queries or we do two separate queries
        const reqQuery = query(collection(db, 'posts'), where('userId', '==', userId));
        const helpQuery = query(collection(db, 'posts'), where('helperId', '==', userId));
        
        const [reqSnap, helpSnap] = await Promise.all([getDocs(reqQuery), getDocs(helpQuery)]);
        const combined = [
          ...reqSnap.docs.map(d => ({ id: d.id, _role: 'Requester', ...d.data() })),
          ...helpSnap.docs.map(d => ({ id: d.id, _role: 'Helper', ...d.data() }))
        ];
        
        // Sort by createdAt descending
        combined.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
      alert("Failed to save profile settings.");
    }
  };

  if (!userId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-8">Loading Profile...</div>
      </AppLayout>
    );
  }

  const timesHelped = history.filter(h => h._role === 'Helper' && ['completed', 'resolved'].includes((h.status||'').toLowerCase())).length;
  const timesRequested = history.filter(h => h._role === 'Requester').length;

  return (
    <AppLayout>
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Header Section */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center border-4 border-background shadow-xl">
              <User className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">{profile?.name || 'Local Citizen'}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" /> {profile?.email || 'No email provided'}
              </p>
              {profile?.isAvailable && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-success/10 text-success mt-3">
                  <CheckCircle className="w-3 h-3" /> Active Volunteer
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-4 relative z-10 w-full md:w-auto">
            <div className="bg-secondary p-4 rounded-xl flex-1 md:flex-none text-center">
              <p className="text-2xl font-bold text-primary">{timesHelped}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Rescues</p>
            </div>
            <div className="bg-secondary p-4 rounded-xl flex-1 md:flex-none text-center">
              <p className="text-2xl font-bold text-destructive">{timesRequested}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">SOS Sent</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity & Contact Details */}
          <div className="md:col-span-1 space-y-6">
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-primary"/> Personal Info</h2>
                <button 
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${isEditing ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-border'}`}
                >
                  {isEditing ? 'Save' : 'Edit'}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Phone Number</label>
                  {isEditing ? (
                    <input type="text" className="w-full mt-1 bg-background border border-border p-2 rounded-lg text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 8900" />
                  ) : (
                    <p className="text-sm font-medium mt-1 flex items-center gap-2"><Phone className="w-3 h-3 text-muted-foreground"/> {profile?.phone || '--'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Gender</label>
                  {isEditing ? (
                    <select className="w-full mt-1 bg-background border border-border p-2 rounded-lg text-sm" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium mt-1">{profile?.gender || '--'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Medical / Bio Info</label>
                  {isEditing ? (
                    <textarea className="w-full mt-1 bg-background border border-border p-2 rounded-lg text-sm h-20" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Any allergies or medical conditions rescuers should know?" />
                  ) : (
                    <p className="text-sm mt-1 text-muted-foreground">{profile?.bio || '--'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">My Skills (Comma separated)</label>
                  {isEditing ? (
                    <textarea className="w-full mt-1 bg-background border border-border p-2 rounded-lg text-sm h-16" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="CPR, First Aid, Swimming, Doctor" />
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile?.skills?.length ? profile.skills.map((s: string) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium">{s}</span>
                      )) : <span className="text-sm text-muted-foreground">--</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency History Ledger */}
          <div className="md:col-span-2">
            <div className="glass-panel p-6 rounded-2xl h-full">
              <h2 className="font-display font-bold flex items-center gap-2 mb-6">
                <ShieldAlert className="w-4 h-4 text-primary"/> Emergency History
              </h2>
              
              {history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No emergency history found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map(item => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 rounded-xl border border-border bg-background/50 flex flex-col sm:flex-row gap-4"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item._role === 'Helper' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                            I was {item._role}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{item.description}</p>
                        <div className="flex items-center gap-2 pt-2 text-xs">
                          <span className="text-muted-foreground">Status:</span>
                          <span className={`font-bold capitalize ${(item.status||'').toLowerCase() === 'completed' ? 'text-success' : 'text-warning'}`}>
                            {(item.status||'pending').replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Connection Block */}
                      <div className="sm:w-48 p-3 rounded-lg bg-secondary/30 border border-border/50 text-xs">
                        <p className="font-bold text-muted-foreground mb-1">
                          {item._role === 'Requester' ? 'Assigned Helper:' : 'Citizen in Need:'}
                        </p>
                        {item._role === 'Requester' ? (
                           item.helperId ? (
                              <div>
                                <p className="font-medium">User: {item.helperId.slice(0, 8)}...</p>
                                <p className="mt-1 text-muted-foreground italic">Connect via Chat</p>
                              </div>
                           ) : <span className="text-warning">Waiting for helper</span>
                        ) : (
                           item.userId ? (
                              <div>
                                <p className="font-medium">User: {item.userId.slice(0, 8)}...</p>
                                <p className="mt-1 text-muted-foreground italic">Connect via Chat</p>
                              </div>
                           ) : <span>Unknown</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </AppLayout>
  );
}
