import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { EmergencyMap } from '@/components/EmergencyMap';
import { StatsBar } from '@/components/StatsBar';
import { RequestCard } from '@/components/RequestCard';
import { HelperToggle } from '@/components/HelperToggle';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const Dashboard = () => {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(liveData);
    });
    return () => unsubscribe();
  }, []);

  const sorted = [...requests].sort((a, b) => {
    const urgencyOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3, critical: 0, high: 1, medium: 2, low: 3 };
    const aVal = urgencyOrder[a.urgency] !== undefined ? urgencyOrder[a.urgency] : 4;
    const bVal = urgencyOrder[b.urgency] !== undefined ? urgencyOrder[b.urgency] : 4;
    return aVal - bVal;
  });

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col p-4 gap-4 h-full min-h-0">
        <div className="shrink-0">
          <StatsBar />
        </div>
        
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* Map Section */}
          <div className="flex-[2] flex flex-col min-w-0 min-h-[400px] lg:min-h-0 map-container">
            <EmergencyMap />
          </div>

          {/* Active Needs Panel */}
          <div className="flex-1 flex flex-col bg-card rounded-[16px] border border-border shadow-sm min-w-0 min-h-0 overflow-hidden">
            {/* Header Area */}
            <div className="shrink-0 flex flex-col gap-3 p-4 border-b border-border/40 bg-background/50 sticky top-0 z-10">
              <HelperToggle />
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-sm">Nearby Requests</h2>
                <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {requests.length} active
                </div>
              </div>
            </div>
            
            {/* Scrollable List Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollBehavior: 'smooth' }}>
              {sorted.map((r) => (
                <RequestCard key={r.id} request={r} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
