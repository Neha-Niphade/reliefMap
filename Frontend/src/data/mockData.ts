export type RequestStatus = 'requested' | 'accepted' | 'on_way' | 'completed' | 'escalated';
export type RequestCategory = 'medical' | 'danger' | 'rescue' | 'women_safety' | 'elderly' | 'fire' | 'flood' | 'other';
export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

export interface HelpRequest {
  id: string;
  type: 'sos' | 'request';
  category: RequestCategory;
  description: string;
  voiceText?: string;
  location: { lat: number; lng: number };
  urgency: UrgencyLevel;
  status: RequestStatus;
  userId: string;
  userName: string;
  createdAt: Date;
  distance?: number;
}

export interface Helper {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  isAvailable: boolean;
  skills?: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isAI?: boolean;
}

export interface ChatThread {
  id: string;
  participants: string[];
  participantNames: string[];
  requestId: string;
  messages: ChatMessage[];
  lastMessage: string;
  updatedAt: Date;
}

// Center: New Delhi
const CENTER = { lat: 28.6139, lng: 77.2090 };

export const mockRequests: HelpRequest[] = [
  {
    id: 'r1', type: 'sos', category: 'medical', description: 'Severe chest pain, need ambulance immediately',
    location: { lat: CENTER.lat + 0.005, lng: CENTER.lng - 0.003 }, urgency: 'critical', status: 'requested',
    userId: 'u1', userName: 'Priya Sharma', createdAt: new Date(Date.now() - 120000), distance: 0.4,
  },
  {
    id: 'r2', type: 'sos', category: 'women_safety', description: 'Being followed by unknown person near metro station',
    location: { lat: CENTER.lat - 0.008, lng: CENTER.lng + 0.006 }, urgency: 'critical', status: 'accepted',
    userId: 'u2', userName: 'Ananya Patel', createdAt: new Date(Date.now() - 300000), distance: 0.9,
  },
  {
    id: 'r3', type: 'request', category: 'elderly', description: 'Elderly person fell down, needs help getting up and basic first aid',
    location: { lat: CENTER.lat + 0.012, lng: CENTER.lng + 0.002 }, urgency: 'high', status: 'on_way',
    userId: 'u3', userName: 'Rajesh Kumar', createdAt: new Date(Date.now() - 600000), distance: 1.3,
  },
  {
    id: 'r4', type: 'request', category: 'flood', description: 'Water logging in basement, need pumping assistance',
    location: { lat: CENTER.lat - 0.003, lng: CENTER.lng - 0.01 }, urgency: 'medium', status: 'requested',
    userId: 'u4', userName: 'Amit Singh', createdAt: new Date(Date.now() - 900000), distance: 1.1,
  },
  {
    id: 'r5', type: 'sos', category: 'fire', description: 'Small fire in kitchen, spreading quickly',
    location: { lat: CENTER.lat + 0.002, lng: CENTER.lng + 0.009 }, urgency: 'critical', status: 'escalated',
    userId: 'u5', userName: 'Meera Reddy', createdAt: new Date(Date.now() - 60000), distance: 0.6,
  },
  {
    id: 'r6', type: 'request', category: 'rescue', description: 'Person trapped under debris after wall collapse',
    location: { lat: CENTER.lat - 0.015, lng: CENTER.lng - 0.005 }, urgency: 'critical', status: 'on_way',
    userId: 'u6', userName: 'Vikram Joshi', createdAt: new Date(Date.now() - 1800000), distance: 1.8,
  },
];

export const mockHelpers: Helper[] = [
  { id: 'h1', name: 'Dr. Arjun Mehta', location: { lat: CENTER.lat + 0.003, lng: CENTER.lng + 0.001 }, isAvailable: true, skills: ['First Aid', 'CPR'] },
  { id: 'h2', name: 'Sanjay Gupta', location: { lat: CENTER.lat - 0.004, lng: CENTER.lng + 0.005 }, isAvailable: true, skills: ['Rescue'] },
  { id: 'h3', name: 'Kavita Nair', location: { lat: CENTER.lat + 0.007, lng: CENTER.lng - 0.006 }, isAvailable: true, skills: ['Medical'] },
  { id: 'h4', name: 'Rohit Desai', location: { lat: CENTER.lat - 0.001, lng: CENTER.lng - 0.008 }, isAvailable: false },
  { id: 'h5', name: 'Neha Agarwal', location: { lat: CENTER.lat + 0.01, lng: CENTER.lng + 0.004 }, isAvailable: true, skills: ['Counseling'] },
];

export const mockChats: ChatThread[] = [
  {
    id: 'c1', participants: ['u2', 'h2'], participantNames: ['Ananya Patel', 'Sanjay Gupta'],
    requestId: 'r2', lastMessage: 'I am 2 minutes away, stay in a well-lit area',
    updatedAt: new Date(Date.now() - 60000),
    messages: [
      { id: 'm1', senderId: 'u2', senderName: 'Ananya Patel', content: 'Please help, someone is following me near Rajiv Chowk metro', timestamp: new Date(Date.now() - 300000) },
      { id: 'm2', senderId: 'h2', senderName: 'Sanjay Gupta', content: 'I am nearby, can you share your exact location?', timestamp: new Date(Date.now() - 240000) },
      { id: 'm3', senderId: 'u2', senderName: 'Ananya Patel', content: 'I am near gate 3 of the metro station', timestamp: new Date(Date.now() - 180000) },
      { id: 'm4', senderId: 'h2', senderName: 'Sanjay Gupta', content: 'I am 2 minutes away, stay in a well-lit area', timestamp: new Date(Date.now() - 60000) },
    ],
  },
  {
    id: 'c2', participants: ['u3', 'h1'], participantNames: ['Rajesh Kumar', 'Dr. Arjun Mehta'],
    requestId: 'r3', lastMessage: 'On my way with first aid kit',
    updatedAt: new Date(Date.now() - 120000),
    messages: [
      { id: 'm5', senderId: 'u3', senderName: 'Rajesh Kumar', content: 'My father fell down the stairs, he is conscious but in pain', timestamp: new Date(Date.now() - 600000) },
      { id: 'm6', senderId: 'h1', senderName: 'Dr. Arjun Mehta', content: 'Do not move him. Is there any visible bleeding?', timestamp: new Date(Date.now() - 540000) },
      { id: 'm7', senderId: 'u3', senderName: 'Rajesh Kumar', content: 'Small cut on forehead, no heavy bleeding', timestamp: new Date(Date.now() - 480000) },
      { id: 'm8', senderId: 'h1', senderName: 'Dr. Arjun Mehta', content: 'On my way with first aid kit', timestamp: new Date(Date.now() - 120000) },
    ],
  },
];

export const statsData = {
  totalHelped: 2847,
  activeRequests: 12,
  completedToday: 34,
  avgResponseTime: '4.2 min',
  helpersOnline: 156,
  criticalActive: 3,
};

export const categoryIcons: Record<RequestCategory, string> = {
  medical: '🏥',
  danger: '⚠️',
  rescue: '🆘',
  women_safety: '🛡️',
  elderly: '👴',
  fire: '🔥',
  flood: '🌊',
  other: '📋',
};

export const statusColors: Record<RequestStatus, string> = {
  requested: 'pending',
  accepted: 'accepted',
  on_way: 'on-way',
  completed: 'completed',
  escalated: 'escalated',
};

export const urgencyColors: Record<UrgencyLevel, string> = {
  critical: 'sos',
  high: 'warning',
  medium: 'info',
  low: 'success',
};
