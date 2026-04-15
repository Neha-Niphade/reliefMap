import { AppLayout } from '@/components/AppLayout';
import { EmergencyMap } from '@/components/EmergencyMap';
import { StatsBar } from '@/components/StatsBar';
import { RequestCard } from '@/components/RequestCard';
import { HelperToggle } from '@/components/HelperToggle';
import { mockRequests } from '@/data/mockData';

const Dashboard = () => {
  const sorted = [...mockRequests].sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <StatsBar />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 220px)' }}>
          {/* Map */}
          <div className="lg:col-span-2 min-h-[300px]">
            <EmergencyMap />
          </div>

          {/* Sidebar feed */}
          <div className="flex flex-col gap-3 overflow-hidden">
            <HelperToggle />
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-sm">Nearby Requests</h2>
              <span className="text-xs text-muted-foreground">{mockRequests.length} active</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {sorted.map(r => <RequestCard key={r.id} request={r} />)}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
