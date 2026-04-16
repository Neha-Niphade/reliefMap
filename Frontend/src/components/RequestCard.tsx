import { motion } from 'framer-motion';
import { Clock, MapPin, CheckCircle, Activity, AlertTriangle, ShieldAlert, Shield, Accessibility, Flame, Waves, Info, Navigation, Signal } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { useUserMap } from '@/hooks/useUserMap';

export const CategoryIcons: Record<string, React.FC<any>> = {
  medical: Activity,
  danger: AlertTriangle,
  rescue: ShieldAlert,
  women_safety: Shield,
  elderly: Accessibility,
  fire: Flame,
  flood: Waves,
  other: Info,
};

const statusLabels: Record<string, string> = {
  requested: 'Requesting',
  accepted: 'Accepted',
  on_way: 'Help On Way',
  completed: 'Completed',
  escalated: 'Escalated',
};

const statusDotColors: Record<string, string> = {
  requested: 'bg-pending',
  accepted: 'bg-accepted',
  on_way: 'bg-on-way',
  completed: 'bg-completed',
  escalated: 'bg-escalated',
};

const urgencyBadgeClasses: Record<string, string> = {
  critical: 'bg-sos/15 text-sos',
  high: 'bg-warning/15 text-warning',
  medium: 'bg-info/15 text-info',
  low: 'bg-success/15 text-success',
};

function timeAgo(dateInput: Date | string) {
  if (!dateInput) return 'Unknown';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'Unknown';
  
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function RequestCard({ request }: { request: any }) {
  const { getUserName } = useUserMap();
  
  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentUserId = localStorage.getItem('user_id');
    const currentUserName = localStorage.getItem('user_name') || currentUserId || 'Helper';
    
    if (!currentUserId) return alert("Please log in to accept requests.");
    if (request.userId === currentUserId) return alert("You cannot accept your own request.");

    try {
      const postRef = doc(db, 'posts', request.id);
      await updateDoc(postRef, {
        status: 'accepted',
        helperId: currentUserId,
        acceptedAt: new Date().toISOString()
      });
      
      const threadId = `thread_${request.id}_${currentUserId}`;
      const threadRef = doc(db, 'threads', threadId);
      await setDoc(threadRef, {
        id: threadId,
        requestId: request.id,
        participantIds: [request.userId, currentUserId],
        lastSenderId: currentUserId,
        lastMessage: "Helper has accepted your request. They are on their way.",
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      alert("Request Accepted! You can now communicate in the Chat tab.");
    } catch (err) {
      console.error(err);
      alert("Failed to accept request.");
    }
  };

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentUserId = localStorage.getItem('user_id');
    if (!currentUserId) return;
    
    try {
      const postRef = doc(db, 'posts', request.id);
      await updateDoc(postRef, {
        status: 'completed'
      });
      alert("Emergency marked as permanently resolved!");
    } catch (err) {
      console.error(err);
      alert("Failed to complete request.");
    }
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!request.location?.lat || !request.location?.lng) {
      alert("Location data is missing for this request.");
      return;
    }
    const { lat, lng } = request.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  const currentUserId = localStorage.getItem('user_id');
  const isRequested = (request.status || '').toLowerCase() === 'requested';
  const isAccepted = (request.status || '').toLowerCase() === 'accepted';
  const isMine = request.userId === currentUserId;
  const isHelper = request.helperId === currentUserId;

  const CatIcon = CategoryIcons[(request.category || '').toLowerCase()] || Info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl bg-secondary/50 border border-border hover:border-muted-foreground/20 transition-colors cursor-pointer flex flex-col gap-3 ${
        request.urgency === 'critical' ? 'border-l-2 border-l-sos' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border">
          <CatIcon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{getUserName(request.userId, request.category)}</span>
            <span className={`status-badge ${urgencyBadgeClasses[(request.urgency || '').toLowerCase()] || 'bg-secondary'}`}>
              {request.urgency || 'Unknown'}
            </span>
            {request.offlineMode && (
              <span className="flex items-center gap-1 text-[10px] font-black text-destructive uppercase tracking-widest bg-destructive/5 px-2 py-0.5 rounded border border-destructive/10">
                <Signal className="w-3 h-3 animate-pulse" /> SMS Sync
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${statusDotColors[(request.status || '').toLowerCase()] || 'bg-border'}`} />
              {statusLabels[(request.status || '').toLowerCase()] || request.status || 'Pending'}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />{(request.distance || 0).toFixed(1)} km
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{timeAgo(request.createdAt)}
            </span>
          </div>
        </div>
      </div>
      
      {(request.location || isRequested || isAccepted) && (
        <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-3 mt-1">
          {request.location?.lat && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleNavigate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors shadow-sm mr-auto"
            >
              <Navigation className="w-3.5 h-3.5" /> Navigate
              {request.distance ? <span className="opacity-70 ml-1 border-l border-primary/20 pl-1.5">{request.distance.toFixed(1)} km</span> : null}
            </motion.button>
          )}

          {isRequested && !isMine && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAccept}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-sm"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Accept Request
            </motion.button>
          )}

          {isAccepted && (isMine || isHelper) && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleComplete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-completed text-white hover:bg-completed/90 transition-colors shadow-sm"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
}
