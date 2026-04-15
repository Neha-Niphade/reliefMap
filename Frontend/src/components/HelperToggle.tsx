import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck } from 'lucide-react';

export function HelperToggle() {
  const [isAvailable, setIsAvailable] = useState(false);

  return (
    <motion.button
      onClick={() => setIsAvailable(!isAvailable)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full ${
        isAvailable ? 'bg-accent/15 border border-accent/30' : 'bg-secondary border border-border'
      }`}
      whileTap={{ scale: 0.98 }}
    >
      {isAvailable ? (
        <ShieldCheck className="w-5 h-5 text-accent" />
      ) : (
        <Shield className="w-5 h-5 text-muted-foreground" />
      )}
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold">
          {isAvailable ? 'Available to Help' : 'Helper Mode Off'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isAvailable ? 'You will receive nearby alerts' : 'Toggle to receive help requests'}
        </p>
      </div>
      <div className={`w-11 h-6 rounded-full relative transition-colors ${
        isAvailable ? 'bg-accent' : 'bg-muted'
      }`}>
        <motion.div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-foreground"
          animate={{ left: isAvailable ? '22px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </motion.button>
  );
}
