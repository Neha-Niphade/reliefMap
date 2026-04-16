import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, MapPin, Zap, Users, ArrowRight, HeartPulse,
  Network, Trophy, UserCheck, Globe, ChevronDown, ShieldAlert
} from 'lucide-react';
import {
  motion, useMotionValue, useTransform, animate,
  useScroll, useSpring,
} from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SOSButton } from '@/components/SOSButton';
import { OfflineBanner } from '@/components/OfflineBanner';

// ─────────────────────────────────────────────────────────────────────────────
// Reusable animation variants
// ─────────────────────────────────────────────────────────────────────────────
const fadeUp: any = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};
const fadeIn: any = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.6 } },
};
const slideRight: any = {
  hidden: { opacity: 0, x: 60, scale: 0.95 },
  show:   { opacity: 1, x: 0,  scale: 1, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};
const staggerContainer = (stagger = 0.12, delayStart = 0) => ({
  hidden: {},
  show:   { transition: { staggerChildren: stagger, delayChildren: delayStart } },
});

// ─────────────────────────────────────────────────────────────────────────────
// Animated count-up number (fires once on viewport entry)
// ─────────────────────────────────────────────────────────────────────────────
function CountUpStat({ end, suffix = '', duration = 2 }: { end: number; suffix?: string; duration?: number }) {
  const [inView, setInView] = useState(false);
  const ref    = useRef<HTMLSpanElement>(null);
  const count  = useMotionValue(0);
  const rounded = useTransform(count, (v) => {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1);
    if (v >= 1_000)     return (v / 1_000).toFixed(1);
    return Math.floor(v).toString();
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(count, end, { duration, ease: 'easeOut' });
    return ctrl.stop;
  }, [inView, end, duration, count]);

  const displaySuffix = end >= 1_000_000 ? 'M+' : end >= 1_000 ? 'K+' : suffix;

  return (
    <span ref={ref} className="inline-flex items-baseline">
      <motion.span>{rounded}</motion.span><span>{displaySuffix}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scroll-progress top bar
// ─────────────────────────────────────────────────────────────────────────────
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: 'left' }}
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-emerald-400 to-primary z-[9999]"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (userId) navigate('/dashboard');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/30 phi-leading overflow-x-hidden">
      <ScrollProgressBar />

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="h-20 flex items-center justify-between px-6 md:px-12 border-b border-border/50 glass-panel sticky top-0 z-50"
      >
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity phi-tracking">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg"
          >
            <Shield className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          <span className="font-display font-bold text-xl tracking-tight">Relief-Map</span>
        </Link>

        <nav className="flex items-center gap-4 md:gap-8">
          <div className="hidden md:flex items-center gap-6 mr-4 border-r border-border/50 pr-8">
            <Link to="/admin/login" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all flex items-center gap-2 group">
              <ShieldAlert className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              Commander Access
            </Link>
          </div>
          
          <LanguageSwitcher />
          <motion.div whileHover={{ y: -1 }} transition={{ type: 'spring', stiffness: 400 }}>
            <Link to="/auth" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Sign In
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/dashboard"
              className="text-sm font-bold bg-primary text-primary-foreground px-6 py-2.5 rounded-full glow-btn shadow-md"
            >
              Get Started
            </Link>
          </motion.div>
        </nav>
      </motion.header>

      <main className="flex-1 flex flex-col">

        {/* ── Hero Section ─────────────────────────────────────────────────── */}
        <section className="relative px-6 py-20 md:py-36 overflow-hidden border-b border-border/30" style={{ background: 'linear-gradient(160deg, hsl(140 50% 97%) 0%, hsl(140 60% 95%) 50%, hsl(160 40% 96%) 100%)' }}>
          {/* Animated background blobs */}
          <div className="absolute top-1/2 left-1/2 blob-drift w-[900px] h-[900px] bg-primary/10 rounded-full blur-[130px] -z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-200/30 rounded-full blur-[100px] -z-10 pointer-events-none" />

          {/* Floating particles (desktop only) */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-primary/40 hidden md:block"
              style={{
                top:  `${15 + i * 12}%`,
                left: `${8  + i * 13}%`,
              }}
              animate={{ y: [0, -18, 0], opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 3 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
            />
          ))}

          <div className="max-w-7xl mx-auto lg:phi-grid-cols items-center gap-12 md:gap-20">

            {/* Left — text block */}
            <motion.div
              variants={staggerContainer(0.14, 0.1)}
              initial="hidden"
              animate="show"
              className="space-y-8 text-left"
            >
              {/* Badge pill */}
              <motion.div variants={fadeUp}>
                <motion.div
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary font-medium text-sm cursor-default"
                  whileHover={{ scale: 1.04, backgroundColor: 'hsl(var(--primary)/0.15)' }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Zap className="w-4 h-4" />
                  </motion.span>
                  Over 10,000 community rescues coordinated.
                </motion.div>
              </motion.div>

              {/* Headline — word-by-word stagger */}
              <motion.h1
                variants={staggerContainer(0.07, 0.15)}
                className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.05] tracking-tighter phi-tracking"
              >
                {(t('landing.title', 'Hyper-Local Emergency Aid.') as string).split(' ').map((word, i) => (
                  <motion.span key={i} variants={fadeUp} className={`inline-block ${i === 2 ? 'gradient-text-animated' : 'mr-4'}`}>
                    {word}{i === 2 ? '' : ' '}
                  </motion.span>
                ))}
              </motion.h1>

              {/* Sub-text */}
              <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-xl phi-leading">
                {t('landing.subtitle', 'When disaster strikes, official systems get overwhelmed. Relief-Map bridges the gap.')}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-5 pt-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/auth"
                    className="w-full sm:w-auto text-base font-bold bg-primary text-primary-foreground px-10 py-5 rounded-full flex items-center justify-center gap-2 glow-btn shadow-lg"
                  >
                    {t('landing.btn_enter', 'Enter Platform')}
                    <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                      <ArrowRight className="w-5 h-5" />
                    </motion.span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/auth"
                    className="w-full sm:w-auto text-base font-bold bg-secondary text-secondary-foreground px-10 py-5 rounded-full flex items-center justify-center gap-2 hover:bg-border transition-colors"
                  >
                    {t('landing.btn_join', 'Join Volunteers')}
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right — floating hero card with UI overlays */}
            <motion.div
              variants={slideRight}
              initial="hidden"
              animate="show"
              className="relative hidden lg:block"
            >
              {/* Main illustrated card */}
              <div className="float-hero phi-aspect rounded-[3rem] overflow-hidden shadow-2xl border border-emerald-200/50 relative"
                style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 40%, #6ee7b7 100%)' }}
              >
                <img
                  src="/auth-hero.png"
                  alt="Community Rescue Network"
                  className="w-full h-full object-cover mix-blend-multiply opacity-70"
                />
                {/* Inner glow overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-600/20" />
                {/* Map grid lines decoration */}
                <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 320" preserveAspectRatio="none">
                  {[0,1,2,3,4,5].map(i => <line key={`h${i}`} x1="0" y1={i*64} x2="400" y2={i*64} stroke="#065f46" strokeWidth="0.8" />)}
                  {[0,1,2,3,4,5,6].map(i => <line key={`v${i}`} x1={i*67} y1="0" x2={i*67} y2="320" stroke="#065f46" strokeWidth="0.8" />)}
                </svg>
              </div>

              {/* Floating card: SOS Received */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                style={{ animation: 'floatY 5s ease-in-out infinite 1s', top: '10%', left: '-14%' }}
                className="absolute bg-white/90 backdrop-blur-xl border border-red-200 rounded-2xl px-4 py-3 shadow-xl min-w-[175px]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-xs font-bold text-red-700">🆘 SOS Received</p>
                </div>
                <p className="text-[11px] text-slate-500">AI triaging severity…</p>
              </motion.div>

              {/* Floating card: Help arriving */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                style={{ animation: 'floatY 6s ease-in-out infinite 0.5s', bottom: '12%', left: '-12%' }}
                className="absolute bg-white/90 backdrop-blur-xl border border-emerald-200 rounded-2xl px-4 py-3 shadow-xl min-w-[185px]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-bold text-emerald-800">✅ Help arriving</p>
                </div>
                <p className="text-[11px] text-slate-500">ETA 4 min · 0.8 km away</p>
              </motion.div>

              {/* Floating card: volunteers nearby */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0, duration: 0.6 }}
                style={{ animation: 'floatY 7s ease-in-out infinite 0.8s', top: '6%', right: '-10%' }}
                className="absolute bg-white/90 backdrop-blur-xl border border-sky-200 rounded-2xl px-4 py-3 shadow-xl min-w-[170px]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  <p className="text-xs font-bold text-sky-800">👥 3 Volunteers</p>
                </div>
                <p className="text-[11px] text-slate-500">Within 2 km radius</p>
              </motion.div>

              {/* Floating badge: avg response */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.6 }}
                style={{ animation: 'floatY 8s ease-in-out infinite 1.5s', bottom: '-4%', right: '5%' }}
                className="absolute bg-white/90 backdrop-blur-xl border border-amber-200 rounded-2xl px-5 py-3 shadow-xl"
              >
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-0.5">Avg. Response</p>
                <p className="text-2xl font-display font-bold text-amber-600">8.4 min</p>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground/50"
          >
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.div>
        </section>
        
        {/* ── Community Stats Section — Repositioned Above Why Decentralized Rescues ── */}
        <section className="phi-p bg-card/50 border-t border-border/50 overflow-hidden relative">
          <div className="absolute inset-0 -z-10">
            <div className="blob-drift absolute top-1/2 left-1/2 w-[600px] h-[400px] bg-primary/6 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div
              variants={staggerContainer(0.1)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="text-center mb-16 space-y-5"
            >
              <motion.div variants={fadeUp}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-semibold text-xs uppercase tracking-widest">
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  Platform Awareness
                </div>
              </motion.div>

              <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-display font-bold phi-tracking leading-tight">
                Connecting Communities<br />
                <span className="gradient-text-animated">When Seconds Count</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl mx-auto phi-leading text-base md:text-lg">
                Strengthening community response by bridging the gap between local resources
                and immediate needs when official channels are overwhelmed.
              </motion.p>
              <motion.p variants={fadeUp} className="text-primary/70 font-bold text-xs uppercase tracking-[0.2em]">
                Based on NCRB India Crime Report 2022
              </motion.p>
            </motion.div>

            {/* Stat cards */}
            <motion.div
              variants={staggerContainer(0.12)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {[
                { icon: Users,      label: "Total Crimes Against Women", end: 445256, suffix: '', color: 'from-emerald-400/20 to-teal-500/20',   iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-500' },
                { icon: Shield,     label: "IPC Crimes Against Women",   end: 365300, suffix: '', color: 'from-sky-400/20 to-blue-500/20',        iconBg: 'bg-sky-500/15',     iconColor: 'text-sky-500'   },
                { icon: MapPin,     label: "Kidnapping & Abduction",     end: 85310,  suffix: '', color: 'from-violet-400/20 to-purple-500/20',   iconBg: 'bg-violet-500/15',  iconColor: 'text-violet-500'},
                { icon: Zap,        label: "Rape Cases",                end: 31516,  suffix: '', color: 'from-amber-400/20 to-orange-500/20',    iconBg: 'bg-amber-500/15',   iconColor: 'text-amber-500' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={fadeUp}
                  whileHover={{ y: -8, scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="relative group bg-background rounded-3xl border border-border hover:border-primary/40 shadow-sm hover:shadow-2xl transition-shadow p-8 flex flex-col items-center text-center gap-5 overflow-hidden"
                >
                  {/* Hover glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />

                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.45 }}
                    className={`relative z-10 w-14 h-14 rounded-2xl ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <stat.icon className={`w-7 h-7 ${stat.iconColor}`} />
                  </motion.div>

                  {/* Number */}
                  <div className="relative z-10 space-y-2">
                    <p className={`text-4xl md:text-5xl font-display font-bold ${stat.iconColor} phi-tracking tabular-nums`}>
                      <CountUpStat end={stat.end} suffix={stat.suffix} duration={2.2} />
                    </p>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider leading-tight">
                      {stat.label}
                    </p>
                  </div>

                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color.replace('/20','/60')} w-0 group-hover:w-full transition-all duration-500`} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Features Section ─────────────────────────────────────────────── */}
        <motion.section
          variants={fadeIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="phi-p bg-card/50 border-y border-border"
        >
          <div className="max-w-6xl mx-auto">
            {/* Section heading */}
            <motion.div
              variants={staggerContainer(0.1)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="text-center mb-20 space-y-6"
            >
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-display font-bold phi-tracking">
                Why Decentralized Rescues?
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl mx-auto phi-leading">
                During a crisis, there is almost always someone capable of helping located just streets away. We simply connect them.
              </motion.p>
            </motion.div>

            {/* Feature cards */}
            <motion.div
              variants={staggerContainer(0.15)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-3 phi-gap"
            >
              {[
                {
                  icon: Zap,
                  title: 'AI Instant Triage',
                  desc: 'Submit a voice note or simple text. Our Gemini AI model analyzes severity and automatically categorizes your emergency in milliseconds.',
                  accent: 'from-amber-400/15 to-orange-400/15',
                  iconColor: 'text-amber-500',
                  iconBg: 'bg-amber-500/12 group-hover:bg-amber-500/20',
                },
                {
                  icon: MapPin,
                  title: 'Live Geolocation',
                  desc: 'Your distress signal creates a geographic boundary alert. Only verified volunteers within your exact radius are immediately notified.',
                  accent: 'from-sky-400/15 to-blue-500/15',
                  iconColor: 'text-sky-500',
                  iconBg: 'bg-sky-500/12 group-hover:bg-sky-500/20',
                },
                {
                  icon: HeartPulse,
                  title: 'Citizen-To-Citizen',
                  desc: 'A secure, anonymous matching system. Off-duty doctors, mechanics, or able-bodied neighbors accept requests and open a secure chat.',
                  accent: 'from-rose-400/15 to-pink-500/15',
                  iconColor: 'text-rose-500',
                  iconBg: 'bg-rose-500/12 group-hover:bg-rose-500/20',
                },
                {
                  icon: Globe,
                  title: 'Disaster Mode Sync',
                  desc: 'One-click transition between standard safety and natural disaster protocols (Flood, Earthquake). The entire AI, Map, and SOS logic adapts community-wide.',
                  accent: 'from-indigo-400/15 to-blue-600/15',
                  iconColor: 'text-indigo-600',
                  iconBg: 'bg-indigo-600/12 group-hover:bg-indigo-600/20',
                },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="phi-p rounded-[2rem] bg-background border border-border shadow-sm hover:shadow-2xl hover:border-primary/25 transition-shadow group flex flex-col phi-gap relative overflow-hidden"
                >
                  {/* Hover gradient wash */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]`} />

                  {/* Icon with bounce */}
                  <motion.div
                    whileHover={{ rotate: [0, -8, 8, 0], scale: 1.15 }}
                    transition={{ duration: 0.5 }}
                    className={`relative z-10 w-16 h-16 rounded-2xl ${feature.iconBg} flex items-center justify-center transition-all shrink-0`}
                  >
                    <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                  </motion.div>

                  <div className="relative z-10 space-y-4">
                    <h3 className="text-2xl font-bold font-display phi-tracking">{feature.title}</h3>
                    <p className="text-muted-foreground phi-leading text-base">{feature.desc}</p>
                  </div>

                  {/* Bottom accent line that grows on hover */}
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${feature.accent.replace('/15', '/50')} w-0 group-hover:w-full transition-all duration-500`} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* ── How It Works Section ──────────────────────────────────────── */}
        <section className="py-20 px-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, hsl(140 50% 97%) 0%, white 60%, hsl(160 40% 97%) 100%)' }}
        >
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={staggerContainer(0.1)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="text-center mb-16 space-y-4"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Simple Process
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-display font-bold phi-tracking">
                How Relief-Map Works
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground max-w-xl mx-auto phi-leading">
                Three steps between a person in crisis and the help they need.
              </motion.p>
            </motion.div>

            <motion.div
              variants={staggerContainer(0.18)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
            >
              {/* Connector line (desktop) */}
              <div className="hidden md:block absolute top-10 left-[22%] right-[22%] h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200" />

              {[
                { step: '01', icon: Zap,       color: 'bg-emerald-600', light: 'bg-emerald-50 border-emerald-200', title: t('landing.step1_title', 'Send SOS'),          desc: 'Tap the SOS button, speak or type your emergency. AI categorizes it instantly.' },
                { step: '02', icon: MapPin,    color: 'bg-teal-600',    light: 'bg-teal-50 border-teal-200',      title: t('landing.step2_title', 'Match & Alert'),     desc: 'Nearby verified volunteers within 2 km are alerted in real-time via map signal.' },
                { step: '03', icon: HeartPulse,color: 'bg-cyan-600',    light: 'bg-cyan-50 border-cyan-200',      title: t('landing.step3_title', 'Help Arrives'),      desc: 'A helper accepts, chats securely, and arrives. Average response: 8.4 minutes.' },
              ].map((step) => (
                <motion.div
                  key={step.step}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  className={`relative flex flex-col items-center text-center p-8 rounded-3xl border ${step.light} shadow-sm hover:shadow-xl transition-all`}
                >
                  {/* Step circle */}
                  <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center shadow-lg mb-5`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-black text-emerald-400/60 tracking-[0.2em] mb-2">STEP {step.step}</span>
                  <h3 className="text-xl font-display font-bold mb-3 phi-tracking">{step.title}</h3>
                  <p className="text-muted-foreground text-sm phi-leading">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA Section ──────────────────────────────────────────────────── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="py-10 px-6"
        >
          <div
            className="max-w-5xl mx-auto phi-p rounded-[3rem] relative overflow-hidden flex flex-col items-center text-center"
            style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)' }}
          >
            {/* Decorative orbs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-300/10 rounded-full blur-[60px] pointer-events-none" />

            {/* Floating background icon */}
            <motion.div
              animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.06, 0.97, 1] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 right-8 opacity-10"
            >
              <Users className="w-52 h-52 text-white" />
            </motion.div>

            <motion.div variants={fadeUp} className="relative z-10 mb-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-bold uppercase tracking-widest">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 1.8, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                Join the Movement
              </div>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-5xl font-display font-bold mb-6 relative z-10 phi-tracking text-white max-w-2xl"
            >
              Ready to make a{' '}
              <span className="text-emerald-300">difference?</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-emerald-100/70 text-lg mb-10 relative z-10 phi-leading max-w-lg">
              Join thousands of citizens actively protecting and assisting their local neighborhoods — for free.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 relative z-10">
              <motion.div whileHover={{ scale: 1.05, boxShadow: '0 0 32px rgba(110,231,183,0.5)' }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 text-base font-bold bg-white text-emerald-900 px-10 py-4 rounded-full shadow-xl transition-all"
                >
                  Register Now
                  <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.1, repeat: Infinity }}>
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 text-base font-bold bg-white/10 border border-white/20 text-white px-10 py-4 rounded-full backdrop-blur transition-all hover:bg-white/15"
                >
                  Sign In Instead
                </Link>
              </motion.div>
            </motion.div>

            {/* Social proof mini-row */}
            <motion.div variants={fadeUp} className="relative z-10 mt-8 flex flex-wrap justify-center items-center gap-6">
              {[
                { val: '10K+', label: 'rescues coordinated' },
                { val: '89K+', label: 'active responders' },
                { val: '8.4 min', label: 'avg response' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className="text-xl font-display font-bold text-emerald-300">{item.val}</p>
                  <p className="text-[11px] text-emerald-100/50 uppercase tracking-wider">{item.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.section>


      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <motion.footer
        variants={fadeIn}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="py-14 border-t border-border mt-auto"
      >
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-base text-foreground">Relief-Map</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Relief-Map Ecosystem &mdash; Open Source Initiative
          </p>
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">Register</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
          </div>
        </div>
      </motion.footer>

      <SOSButton />
      <OfflineBanner />
    </div>
  );
}
