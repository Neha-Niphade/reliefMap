import { useEffect, useState, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import { CategoryIcons } from './RequestCard';
import { Info, User as UserIcon, Plus, Minus, LocateFixed } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useUserMap } from '@/hooks/useUserMap';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

// Colours keyed on urgency level
const urgencyColors: Record<string, string> = {
  Critical: '#dc2626', critical: '#dc2626',
  High:     '#f59e0b', high:     '#f59e0b',
  Medium:   '#3b82f6', medium:   '#3b82f6',
  Low:      '#22c55e', low:      '#22c55e',
  undefined:'#888888',
};

// ── 2 km dashed radius circle drawn as an SVG overlay ────────────────────────
function RadiusCircle({ center }: { center: google.maps.LatLngLiteral }) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;
    if (circleRef.current) circleRef.current.setMap(null);

    circleRef.current = new google.maps.Circle({
      map,
      center,
      radius: 2000, // metres
      strokeColor: '#3b82f6',
      strokeOpacity: 0.6,
      strokeWeight: 1.5,
      fillColor: '#3b82f6',
      fillOpacity: 0.04,
    });

    return () => { circleRef.current?.setMap(null); };
  }, [map, center]);

  return null;
}

// ── Urgency dot marker for SOS requests ──────────────────────────────────────
function RequestMarker({ request }: { request: any }) {
  const map = useMap();
  const { getUserName } = useUserMap();
  const [open, setOpen] = useState(false);
  const CatIcon = CategoryIcons[(request.category || '').toLowerCase()] || Info;
  const color = urgencyColors[request.urgency] ?? '#888888';
  const pos = {
    lat: request.location?.lat || DEFAULT_CENTER.lat,
    lng: request.location?.lng || DEFAULT_CENTER.lng,
  };

  const handleClick = () => {
    setOpen(o => !o);
    if (!open && map) {
      map.panTo(pos);
      if ((map.getZoom() || 14) < 16) {
        map.setZoom(16);
      }
    }
  };

  return (
    <AdvancedMarker position={pos} onClick={handleClick}>
      <div className="relative flex items-center justify-center">
        {(request.urgency || '').toLowerCase() === 'critical' && (
          <span className="absolute w-10 h-10 rounded-full bg-sos/40 animate-ping" />
        )}
        <div
          style={{ background: color }}
          className="relative z-10 w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform"
        />
      </div>
      {/* Info popup */}
      {open && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl p-3 shadow-xl text-xs w-44 space-y-1"
          onClick={e => e.stopPropagation()}
        >
          <div className="font-bold flex items-center gap-1">
            <CatIcon className="w-3.5 h-3.5 text-primary" />
            <span className="truncate">{getUserName(request.userId, request.category)}</span>
          </div>
          <p className="text-muted-foreground truncate">{request.description}</p>
          <p className="opacity-60 uppercase tracking-wide text-[10px]">
            {request.urgency || 'UNKNOWN'} · {request.status}
          </p>
          <button
            className="absolute top-1 right-1 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >✕</button>
        </div>
      )}
    </AdvancedMarker>
  );
}

// ── Helper (available volunteer) marker ──────────────────────────────────────
function HelperMarker({ helper }: { helper: any }) {
  const map = useMap();
  const [open, setOpen] = useState(false);
  const lat = helper.location?.lat && helper.location.lat !== 0 ? helper.location.lat : DEFAULT_CENTER.lat + 0.01;
  const lng = helper.location?.lng && helper.location.lng !== 0 ? helper.location.lng : DEFAULT_CENTER.lng + 0.01;

  const handleClick = () => {
    setOpen(o => !o);
    if (!open && map) {
      map.panTo({ lat, lng });
      if ((map.getZoom() || 14) < 16) {
        map.setZoom(16);
      }
    }
  };

  return (
    <AdvancedMarker position={{ lat, lng }} onClick={handleClick}>
      <Pin background="#22c55e" glyphColor="#fff" borderColor="#16a34a" scale={0.85} />
      {open && (
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl p-3 shadow-xl text-xs w-40 space-y-1"
          onClick={e => e.stopPropagation()}
        >
          <div className="font-bold flex items-center gap-1">
            <UserIcon className="w-3.5 h-3.5 text-green-500" />
            <span className="truncate">{helper.name}</span>
          </div>
          {helper.skills?.length > 0 && (
            <p className="text-muted-foreground truncate">{helper.skills.join(', ')}</p>
          )}
          <button
            className="absolute top-1 right-1 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >✕</button>
        </div>
      )}
    </AdvancedMarker>
  );
}

// ── User Location Marker ──────────────────────────────────────────────────────
function UserMarker({ center }: { center: google.maps.LatLngLiteral }) {
  return (
    <AdvancedMarker position={center}>
      {/* Pulsing blue dot */}
      <div className="relative flex items-center justify-center">
        <span className="absolute w-8 h-8 rounded-full bg-blue-500/25 animate-ping" />
        <span className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
      </div>
    </AdvancedMarker>
  );
}

// ── Custom Map UI Controls ───────────────────────────────────────────────────
function MapControlsOverlay({ userCenter }: { userCenter: google.maps.LatLngLiteral }) {
  const map = useMap();

  if (!map) return null;

  const handleZoomIn = () => {
    const current = map.getZoom() || 14;
    map.setZoom(current + 1);
  };

  const handleZoomOut = () => {
    const current = map.getZoom() || 14;
    map.setZoom(current - 1);
  };

  const handleLocateMe = () => {
    map.panTo(userCenter);
    map.setZoom(15);
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-3">
      {/* Premium Glassmorphic Zoom Controls */}
      <div className="flex flex-col bg-background/80 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden">
        <motion.button
          whileHover={{ backgroundColor: 'hsl(var(--primary)/0.15)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleZoomIn}
          className="p-3 text-primary hover:text-primary transition-colors border-b border-primary/10 flex items-center justify-center focus:outline-none"
          title="Zoom In"
        >
          <Plus className="w-5 h-5 font-bold" />
        </motion.button>
        <motion.button
          whileHover={{ backgroundColor: 'hsl(var(--primary)/0.15)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleZoomOut}
          className="p-3 text-primary hover:text-primary transition-colors flex items-center justify-center focus:outline-none"
          title="Zoom Out"
        >
          <Minus className="w-5 h-5 font-bold" />
        </motion.button>
      </div>

      {/* Locate Me Container */}
      <motion.button
        whileHover={{ scale: 1.05, backgroundColor: 'hsl(var(--primary)/0.15)' }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLocateMe}
        className="p-3 bg-background/80 backdrop-blur-xl border border-primary/20 text-primary rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-colors flex items-center justify-center focus:outline-none"
        title="Locate Me"
      >
        <LocateFixed className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

// ── Main Map Component ────────────────────────────────────────────────────────
export function EmergencyMap() {
  const [requests, setRequests] = useState<any[]>([]);
  const [helpers, setHelpers]   = useState<any[]>([]);
  const [userCenter, setUserCenter] = useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => console.log('Geolocation failed:', err)
      );
    }

    if (!db) return;

    const unSubPosts = onSnapshot(query(collection(db, 'posts')), snap => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unSubUsers = onSnapshot(query(collection(db, 'users')), snap => {
      setHelpers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(h => h.isAvailable));
    });

    return () => { unSubPosts(); unSubUsers(); };
  }, []);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border relative">
      <APIProvider apiKey={GOOGLE_MAPS_KEY}>
        <Map
          mapId="relief-map-main"
          defaultCenter={userCenter}
          defaultZoom={14}
          disableDefaultUI={true}
          gestureHandling="greedy"
          className="w-full h-full"
          style={{ borderRadius: '0.75rem' }}
          // Styled map — dark/clean aesthetic matching the app theme
          styles={[
            { elementType: 'geometry',            stylers: [{ color: '#f5f5f9' }] },
            { elementType: 'labels.text.fill',    stylers: [{ color: '#1a3a2a' }] },
            { elementType: 'labels.text.stroke',  stylers: [{ color: '#ffffff' }] },
            { featureType: 'road',                elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
            { featureType: 'road',                elementType: 'geometry.stroke', stylers: [{ color: '#e0e0e0' }] },
            { featureType: 'water',               elementType: 'geometry', stylers: [{ color: '#c8e6f5' }] },
            { featureType: 'poi.park',            elementType: 'geometry', stylers: [{ color: '#d4edda' }] },
            { featureType: 'transit',             elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
            { featureType: 'administrative',      elementType: 'geometry.stroke', stylers: [{ color: '#c9c9c9' }] },
          ]}
        >
          {/* 2 km radius ring */}
          <RadiusCircle center={userCenter} />

          {/* My location */}
          <UserMarker center={userCenter} />

          {/* SOS requests */}
          {requests.map(r => <RequestMarker key={r.id} request={r} />)}

          {/* Available helpers */}
          {helpers.map(h => <HelperMarker key={h.id} helper={h} />)}

          {/* Custom Overlay Controls */}
          <MapControlsOverlay userCenter={userCenter} />
        </Map>
      </APIProvider>
    </div>
  );
}
