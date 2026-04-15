import { motion } from 'framer-motion';
import { Clock, MapPin, CheckCircle, Activity, AlertTriangle, ShieldAlert, Shield, Accessibility, Flame, Waves, Info } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

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
        participantNames: [request.userName || request.userId, currentUserName],
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
            <span className="font-semibold text-sm truncate">{request.userName || request.userId || 'Anonymous'}</span>
            <span className={`status-badge ${urgencyBadgeClasses[(request.urgency || '').toLowerCase()] || 'bg-secondary'}`}>
              {request.urgency || 'Unknown'}
            </span>
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
      
      {isRequested && !isMine && (
        <div className="flex justify-end border-t border-border/50 pt-2 mt-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAccept}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-sm"
          >
            <CheckCircle className="w-3 h-3" /> Accept Request
          </motion.button>
        </div>
      )}

      {isAccepted && (isMine || isHelper) && (
        <div className="flex justify-end border-t border-border/50 pt-2 mt-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleComplete}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-completed text-white hover:bg-completed/90 transition-colors shadow-sm"
          >
            <CheckCircle className="w-3 h-3" /> Mark Resolved
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
