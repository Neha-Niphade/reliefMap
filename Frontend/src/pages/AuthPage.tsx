import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, Shield, ArrowRight,
  HeartPulse, MapPin, Users, Zap, CheckCircle2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const slideLeft = {
  hidden: { opacity: 0, x: -50 },
  show: { opacity: 1, x: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } },
};

// ── Trust points shown on the left panel ─────────────────────────────────────
const trustPoints = [
  { icon: Zap, text: 'AI triage in under 2 seconds' },
  { icon: MapPin, text: 'Hyper-local 2 km radius matching' },
  { icon: Users, text: '89K+ community responders active' },
  { icon: HeartPulse, text: 'Average response time: 8.4 min' },
];

// ── Floating notification cards on the left panel ────────────────────────────
const floatingCards = [
  { top: '18%', left: '4%', delay: 0, label: '🆘 SOS Received', sub: 'AI triaging now…', color: 'from-red-500/20 to-rose-400/10' },
  { top: '52%', left: '-2%', delay: 0.5, label: '✅ Helper on way', sub: 'ETA 4 min · 0.8 km away', color: 'from-emerald-500/20 to-teal-400/10' },
  { top: '76%', left: '6%', delay: 1.0, label: '🗺️ 3 nearby', sub: 'Volunteers within 2 km', color: 'from-sky-500/20 to-blue-400/10' },
];

export default function AuthPage() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? '/login/' : '/register/';
      const body = isLogin ? { email, password } : { email, password, name };
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('user_id', data.userId);
        localStorage.setItem('user_name', isLogin ? data.name : name);
        
        // Push initial location to Firestore for real-time tracking
        if (navigator.geolocation && db) {
          navigator.geolocation.getCurrentPosition((pos) => {
            updateDoc(doc(db, 'users', data.userId), {
              location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
            });
          });
        }
        
        navigate('/dashboard');
      } else {
        setError(data.error || 'Authentication failed. Please try again.');
      }
    } catch {
      setError('Could not reach the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(v => !v);
    setError('');
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">

      {/* ── LEFT PANEL — Hero / Illustration ─────────────────────────────── */}
      <motion.div
        variants={slideLeft}
        initial="hidden"
        animate="show"
        className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 75%, #059669 100%)' }}
      >
        {/* Mesh gradient orbs */}
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-400/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-teal-300/15 blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 right-8 w-[250px] h-[250px] rounded-full bg-emerald-500/10 blur-[60px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-white tracking-tight">Relief-Map</span>
        </div>

        {/* Central illustration area */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-8">
          {/* Illustration image */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-full max-w-sm"
          >
            <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))' }}
            >
              <img
                src="/auth-hero.png"
                alt="Community rescue illustration"
                className="w-full h-full object-cover mix-blend-luminosity opacity-90"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 via-transparent to-transparent" />
            </div>

            {/* Floating notification cards */}
            {floatingCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + card.delay, duration: 0.6 }}
                style={{ top: card.top, left: card.left }}
                className={`absolute z-20 bg-gradient-to-br ${card.color} backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 shadow-xl min-w-[185px]`}
              >
                <p className="text-white text-xs font-bold">{card.label}</p>
                <p className="text-white/70 text-[10px] mt-0.5">{card.sub}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Headline text */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="text-center mt-8 space-y-3"
          >
            <motion.h2 variants={fadeUp} className="text-3xl font-display font-bold text-white leading-tight">
              Every second matters.<br />
              <span className="text-emerald-300">Be the help.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-emerald-100/70 text-sm max-w-xs mx-auto leading-relaxed">
              Join a network of community responders making real-time impact when lives are at stake.
            </motion.p>
          </motion.div>
        </div>

        {/* Trust points */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10 grid grid-cols-2 gap-3"
        >
          {trustPoints.map((point) => (
            <motion.div
              key={point.text}
              variants={fadeUp}
              className="flex items-center gap-2 bg-white/8 backdrop-blur border border-white/10 rounded-xl px-3 py-2.5"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-400/20 flex items-center justify-center shrink-0">
                <point.icon className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <p className="text-white/80 text-[11px] font-medium leading-tight">{point.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── RIGHT PANEL — Auth Form ──────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-y-auto">
        {/* Language Switcher */}
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>

        {/* Subtle background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/60 rounded-full blur-[80px] -z-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-100/50 rounded-full blur-[60px] -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-emerald-900">Relief-Map</span>
          </div>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 shadow-2xl shadow-emerald-900/8 rounded-[2rem] p-8 md:p-10">

            {/* Mode toggle tabs */}
            <div className="flex bg-emerald-50 rounded-xl p-1 mb-8">
              {['Sign In', 'Create Account'].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => { setIsLogin(i === 0); setError(''); }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${(i === 0) === isLogin
                      ? 'bg-white text-emerald-800 shadow-sm shadow-emerald-200'
                      : 'text-emerald-600/70 hover:text-emerald-700'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Heading */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login-head' : 'reg-head'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="mb-7"
              >
                <h1 className="text-2xl font-display font-bold text-emerald-900">
                  {isLogin ? t('auth.welcome', 'Welcome back 👋') : t('auth.create', 'Join the network 🌿')}
                </h1>
                <p className="text-emerald-600/70 text-sm mt-1">
                  {isLogin
                    ? 'Sign in to your Relief-Map account'
                    : 'Create your free account and start helping today'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name field (register only) */}
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <label className="block text-xs font-semibold text-emerald-700 mb-1.5 uppercase tracking-wide">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      <input
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required={!isLogin}
                        className="w-full pl-10 pr-4 py-3 bg-emerald-50/60 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all text-sm text-emerald-900 placeholder:text-emerald-400/60"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-emerald-700 mb-1.5 uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-emerald-50/60 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all text-sm text-emerald-900 placeholder:text-emerald-400/60"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-emerald-700 mb-1.5 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  <input
                    type="password"
                    placeholder={isLogin ? '••••••••' : 'Min 8 characters'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-emerald-50/60 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all text-sm text-emerald-900 placeholder:text-emerald-400/60"
                  />
                </div>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
                  >
                    <span className="text-red-500">⚠</span> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(16,185,129,0.4)' }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)' }}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    {isLogin ? t('auth.signin_btn', 'Sign In to Dashboard') : t('auth.register_btn', 'Create My Account')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Switch link */}
            <p className="mt-6 text-center text-sm text-emerald-600/70">
              {isLogin ? "New to Relief-Map? " : "Already have an account? "}
              <button
                onClick={switchMode}
                className="font-semibold text-emerald-700 hover:text-emerald-900 hover:underline transition-colors"
              >
                {isLogin ? 'Create a free account' : 'Sign in instead'}
              </button>
            </p>

            {/* Terms note */}
            {!isLogin && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-center text-[11px] text-emerald-500/60 leading-relaxed"
              >
                By creating an account you agree to our{' '}
                <span className="underline cursor-pointer">Terms of Service</span> and{' '}
                <span className="underline cursor-pointer">Privacy Policy</span>.
              </motion.p>
            )}

            {/* Social proof row */}
            <div className="mt-6 pt-5 border-t border-emerald-100 flex items-center justify-center gap-4">
              {[
                { icon: CheckCircle2, text: 'AI-powered triage' },
                { icon: CheckCircle2, text: 'Free forever' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-1.5 text-emerald-600/60 text-xs">
                  <item.icon className="w-3.5 h-3.5 text-emerald-500" />
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Back to landing */}
          <div className="mt-5 text-center">
            <Link to="/" className="text-xs text-emerald-600/50 hover:text-emerald-700 transition-colors">
              ← Back to homepage
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
