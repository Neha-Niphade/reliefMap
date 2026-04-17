import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { RequestCard } from '@/components/RequestCard';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { History, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const MyRequestsPage = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const currentUserId = localStorage.getItem('user_id');

  useEffect(() => {
    if (!db || !currentUserId) return;

    const unsub = onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc')), (snap) => {
      const posts = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setRequests(posts.filter(p => p.userId === currentUserId));
    });

    return () => unsub();
  }, [currentUserId]);

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-background p-4 md:p-8 gap-6 overflow-y-auto">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
             <History className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">My Requests</h1>
            <p className="text-sm text-muted-foreground font-medium">History of your emergencies and requests</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {requests.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="col-span-full flex flex-col items-center justify-center h-[50vh] text-muted-foreground text-sm gap-3 bg-secondary/20 rounded-3xl border border-border border-dashed"
            >
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center border border-border shadow-sm">
                <Search className="w-7 h-7 opacity-20" />
              </div>
              <p className="font-semibold text-base">No requests found</p>
              <p className="text-xs opacity-70">You haven't made any emergency requests yet.</p>
            </motion.div>
          ) : (
             requests.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.5) }}
                >
                  <RequestCard request={r} />
                </motion.div>
             ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default MyRequestsPage;
