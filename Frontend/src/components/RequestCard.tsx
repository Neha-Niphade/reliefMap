import { motion } from 'framer-motion';
import { Clock, MapPin } from 'lucide-react';
import type { HelpRequest } from '@/data/mockData';
import { categoryIcons } from '@/data/mockData';

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

function timeAgo(date: Date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function RequestCard({ request }: { request: HelpRequest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl bg-secondary/50 border border-border hover:border-muted-foreground/20 transition-colors cursor-pointer ${
        request.urgency === 'critical' ? 'border-l-2 border-l-sos' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{categoryIcons[request.category]}</span>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{request.userName}</span>
            <span className={`status-badge ${urgencyBadgeClasses[request.urgency]}`}>
              {request.urgency}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${statusDotColors[request.status]}`} />
              {statusLabels[request.status]}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />{request.distance?.toFixed(1)} km
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{timeAgo(request.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
