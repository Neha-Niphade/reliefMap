import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Lock, User, ArrowRight, Activity, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import adminData from '@/config/admin_creds.json';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay for that "Secure Terminal" feel
    await new Promise(resolve => setTimeout(resolve, 1500));

    const admin = adminData.admins.find(a => a.email === email && a.password === password);

    if (admin) {
      localStorage.setItem('admin_session', 'true');
      localStorage.setItem('admin_name', admin.name);
      localStorage.setItem('admin_role', admin.level);
      navigate('/admin');
    } else {
      setError('Invalid Cryptographic Credentials. ACCESS_DENIED.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* ── BACKGROUND AMBIANCE ───────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        {/* LOGO AREA */}
        <div className="flex flex-col items-center mb-10 space-y-4">
           <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/20">
              <ShieldAlert className="w-8 h-8 text-primary animate-pulse" />
           </div>
           <div className="text-center">
             <h1 className="text-2xl font-black tracking-tighter uppercase italic">Strategic <span className="text-primary not-italic">Admin</span></h1>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-50">Unified Emergency Command</p>
           </div>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-[#0f0f0f]/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-3xl relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
           
           <div className="mb-8">
              <h2 className="text-xl font-black tracking-tight">Security Gateway</h2>
              <p className="text-xs text-muted-foreground font-medium mt-1">Authenticate using regional commander clearance.</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Command Email</label>
                 <div className="relative group/input">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                    <input 
                      type="email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="commander@reliefmap.gov"
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/10"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center pr-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Encrypted Key</label>
                    <span className="text-[8px] font-black uppercase text-primary tracking-widest cursor-pointer hover:underline">Forgot Key?</span>
                 </div>
                 <div className="relative group/input">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                    <input 
                      type="password" required
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/10 font-mono"
                    />
                 </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive"
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group/btn relative overflow-hidden"
              >
                {isLoading ? (
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => <motion.div key={i} animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, delay: i * 0.15 }} className="w-1.5 h-1.5 bg-white rounded-full" />)}
                  </div>
                ) : (
                  <>
                    Initialize Terminal <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
           </form>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4">
           {[
             { label: 'Network', value: 'SYNAM_SEC_4', icon: Globe },
             { label: 'Latency', value: '4ms / LOCAL', icon: Activity }
           ].map(stat => (
             <div key={stat.label} className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                   <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                   <p className="text-[10px] font-bold font-mono text-white/70">{stat.value}</p>
                </div>
                <stat.icon className="w-3.5 h-3.5 text-white/20" />
             </div>
           ))}
        </div>

        <p className="mt-12 text-center text-[8px] font-black uppercase tracking-[0.5em] text-white/10 animate-pulse">
           RESTRICTED ACCESS · RELIEF-MAP INTELLIGENCE CORE
        </p>
      </motion.div>
    </div>
  );
}
