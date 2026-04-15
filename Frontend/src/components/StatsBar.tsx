import { statsData } from '@/data/mockData';
import { Users, Activity, CheckCircle, Clock, Shield, AlertTriangle } from 'lucide-react';

const stats = [
  { icon: Users, label: 'People Helped', value: statsData.totalHelped.toLocaleString(), color: 'text-accent' },
  { icon: Activity, label: 'Active Now', value: statsData.activeRequests, color: 'text-warning' },
  { icon: CheckCircle, label: 'Completed Today', value: statsData.completedToday, color: 'text-success' },
  { icon: Clock, label: 'Avg Response', value: statsData.avgResponseTime, color: 'text-info' },
  { icon: Shield, label: 'Helpers Online', value: statsData.helpersOnline, color: 'text-accent' },
  { icon: AlertTriangle, label: 'Critical', value: statsData.criticalActive, color: 'text-sos' },
];

export function StatsBar() {
  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map(s => (
        <div key={s.label} className="bg-secondary/50 rounded-xl p-3 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <s.icon className={`w-4 h-4 ${s.color}`} />
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
          <p className="font-display font-bold text-lg">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
