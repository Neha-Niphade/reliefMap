import { Link, useNavigate } from 'react-router-dom';
import { Shield, MapPin, Zap, Users, ArrowRight, HeartPulse } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, we might want to redirect them or let them choose to enter.
    const userId = localStorage.getItem('user_id');
    if (userId) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/30 phi-leading">
      
      {/* Navigation Bar */}
      <header className="h-20 flex items-center justify-between px-6 md:px-12 border-b border-border/50 glass-panel sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity phi-tracking">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Relief-Map</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/auth" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Sign In
          </Link>
          <Link to="/auth" className="text-sm font-bold bg-primary text-primary-foreground px-6 py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative px-6 py-20 md:py-32 overflow-hidden border-b border-border/30">
          {/* Background Decorative Blobs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10" />
          
          <div className="max-w-7xl mx-auto lg:phi-grid-cols items-center gap-12 md:gap-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8 text-left"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary font-medium text-sm">
                <Zap className="w-4 h-4" /> Over 10,000 community rescues coordinated.
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.05] tracking-tighter phi-tracking">
                Hyper-Local <br/>
                <span className="text-transparent bg-clip-text gradient-primary">Emergency Aid.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl phi-leading">
                When disaster strikes, official systems get overwhelmed. Relief-Map bridges the gap, allowing citizens to broadcast SOS signals and intelligently coordinate immediate rescue efforts with nearby volunteers using AI.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                <Link to="/auth" className="w-full sm:w-auto text-base font-bold bg-primary text-primary-foreground px-10 py-5 rounded-full flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-1">
                  Enter Platform <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/auth" className="w-full sm:w-auto text-base font-bold bg-secondary text-secondary-foreground px-10 py-5 rounded-full flex items-center justify-center gap-2 hover:bg-border transition-all">
                  Join Volunteers
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="phi-aspect bg-gradient-to-tr from-primary/20 to-success/20 rounded-[3rem] overflow-hidden shadow-2xl p-4 border border-white/20">
                <img 
                  src="/hero-image.png" 
                  alt="Community Rescue Network" 
                  className="w-full h-full object-cover rounded-[2rem] shadow-inner"
                />
              </div>
              {/* Floating Stat Card Decor */}
              <div className="absolute -bottom-6 -left-6 glass-panel p-6 rounded-2xl shadow-xl space-y-2 max-w-[200px] border-primary/20 scale-110">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Avg. Response</p>
                <p className="text-3xl font-display font-bold text-primary">8.4 min</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features / Moto Section */}
        <section className="phi-p bg-card/50 border-y border-border">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20 space-y-6">
              <h2 className="text-3xl md:text-4xl font-display font-bold phi-tracking">Why Decentralized Rescues?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto phi-leading">During a crisis, there is almost always someone capable of helping located just streets away. We simply connect them.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 phi-gap">
              {[
                {
                  icon: Zap,
                  title: 'AI Instant Triage',
                  desc: 'Submit a voice note or simple text. Our Gemini AI model analyzes the severity and automatically categorizes your emergency in milliseconds.'
                },
                {
                  icon: MapPin,
                  title: 'Live Geolocation',
                  desc: 'Your distress signal creates a geographic boundary alert. Only verified volunteers within your exact radius are immediately notified.'
                },
                {
                  icon: HeartPulse,
                  title: 'Citizen-To-Citizen',
                  desc: 'A secure, anonymous matching system. Off-duty doctors, mechanics, or able-bodied neighbors accept the request and open a secure chat.'
                }
              ].map((feature, i) => (
                <motion.div 
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="phi-p rounded-[2rem] bg-background border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all group flex flex-col phi-gap"
                >
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all shrink-0">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold font-display phi-tracking">{feature.title}</h3>
                    <p className="text-muted-foreground phi-leading text-base">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Global Impact CTA */}
        <section className="phi-p text-center">
          <div className="max-w-4xl mx-auto glass-panel phi-p rounded-[3rem] border border-primary/20 bg-primary/5 relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Users className="w-48 h-48 text-primary" />
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-8 relative z-10 phi-tracking max-w-2xl">Ready to make a difference?</h2>
            <p className="text-lg text-muted-foreground mb-10 relative z-10 phi-leading max-w-xl">Join thousands of citizens actively protecting and assisting their local neighborhoods.</p>
            <Link to="/auth" className="inline-flex items-center gap-2 text-base font-bold bg-foreground text-background px-10 py-5 rounded-full hover:scale-105 transition-transform shadow-xl relative z-10">
              Register Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

      </main>

      {/* Basic Footer */}
      <footer className="py-12 text-center text-sm text-muted-foreground border-t border-border mt-auto">
        <p>&copy; {new Date().getFullYear()} Relief-Map Ecosystem. Open Source Initiative.</p>
      </footer>

    </div>
  );
}
