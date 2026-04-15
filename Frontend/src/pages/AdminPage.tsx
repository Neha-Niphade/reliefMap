import { AppLayout } from '@/components/AppLayout';
import { mockRequests, mockHelpers, statsData, categoryIcons, type RequestCategory } from '@/data/mockData';
import { AlertTriangle, TrendingUp, MapPin, Clock, Users, ShieldCheck } from 'lucide-react';

function AdminPage() {
  const categoryCount = mockRequests.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusCount = mockRequests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const criticalRequests = mockRequests.filter(r => r.urgency === 'critical');
  const activeHelpers = mockHelpers.filter(h => h.isAvailable);

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Government & NGO Monitoring Panel</p>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total Helped', value: statsData.totalHelped.toLocaleString(), color: 'text-accent', bg: 'bg-accent/10' },
            { icon: AlertTriangle, label: 'Critical Active', value: statsData.criticalActive, color: 'text-sos', bg: 'bg-sos/10' },
            { icon: Clock, label: 'Avg Response', value: statsData.avgResponseTime, color: 'text-info', bg: 'bg-info/10' },
            { icon: ShieldCheck, label: 'Helpers Online', value: statsData.helpersOnline, color: 'text-success', bg: 'bg-success/10' },
          ].map(m => (
            <div key={m.label} className="bg-card border border-border rounded-xl p-5">
              <div className={`w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center mb-3`}>
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <p className="text-2xl font-display font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Crisis Zone Heatmap Indicator */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-warning" />
              <h3 className="font-display font-bold">Crisis Zones</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(categoryCount).map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-lg w-8">{categoryIcons[cat as RequestCategory]}</span>
                  <span className="text-sm flex-1 capitalize">{cat.replace('_', ' ')}</span>
                  <div className="flex-1 bg-secondary rounded-full h-2">
                    <div
                      className="h-2 rounded-full gradient-emergency"
                      style={{ width: `${(count / mockRequests.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status breakdown */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-info" />
              <h3 className="font-display font-bold">Request Status</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(statusCount).map(([status, count]) => {
                const colors: Record<string, string> = {
                  requested: 'bg-pending', accepted: 'bg-accepted', on_way: 'bg-on-way',
                  completed: 'bg-completed', escalated: 'bg-escalated',
                };
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors[status]}`} />
                    <span className="text-sm flex-1 capitalize">{status.replace('_', ' ')}</span>
                    <span className="text-sm font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical alerts */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-sos" />
              <h3 className="font-display font-bold">Critical Alerts</h3>
            </div>
            <div className="space-y-2">
              {criticalRequests.map(r => (
                <div key={r.id} className="p-3 rounded-lg bg-sos/5 border border-sos/20 flex items-start gap-3">
                  <span className="text-lg">{categoryIcons[r.category]}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{r.userName}</p>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                    <p className="text-xs text-sos mt-1">{r.status.replace('_', ' ').toUpperCase()} · {r.distance?.toFixed(1)} km</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active helpers */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              <h3 className="font-display font-bold">Active Helpers</h3>
            </div>
            <div className="space-y-2">
              {activeHelpers.map(h => (
                <div key={h.id} className="p-3 rounded-lg bg-success/5 border border-success/20 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full gradient-safe flex items-center justify-center text-xs font-bold text-success-foreground">
                    {h.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{h.name}</p>
                    {h.skills && <p className="text-xs text-muted-foreground">{h.skills.join(' · ')}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default AdminPage;
