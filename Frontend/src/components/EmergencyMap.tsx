import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CategoryIcons } from './RequestCard';
import { Info, User as UserIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

const DEFAULT_CENTER: [number, number] = [28.6139, 77.2090]; // Fallback if blocked

const urgencyRadii: Record<string, number> = { Critical: 10, High: 8, Medium: 7, Low: 6, critical: 10, high: 8, medium: 7, low: 6, undefined: 5 };
const urgencyFills: Record<string, string> = { Critical: '#dc2626', High: '#f59e0b', Medium: '#3b82f6', Low: '#22c55e', critical: '#dc2626', high: '#f59e0b', medium: '#3b82f6', low: '#22c55e', undefined: '#888' };

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export function EmergencyMap() {
  const [requests, setRequests] = useState<any[]>([]);
  const [helpers, setHelpers] = useState<any[]>([]);
  const [userCenter, setUserCenter] = useState<[number, number]>(DEFAULT_CENTER);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCenter([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.log("Geolocation disabled/failed: ", err)
      );
    }
    
    if (!db) return;
    const qPosts = query(collection(db, 'posts'));
    const unSubPosts = onSnapshot(qPosts, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(liveData);
    });
    
    const qUsers = query(collection(db, 'users'));
    const unSubUsers = onSnapshot(qUsers, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHelpers(liveData.filter(h => h.isAvailable));
    });
    
    return () => { unSubPosts(); unSubUsers(); };
  }, []);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border relative">
      <MapContainer center={userCenter} zoom={14} className="w-full h-full" zoomControl={false}>
        <MapUpdater center={userCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 2km radius indicator */}
        <Circle center={userCenter} radius={2000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.04, weight: 1, dashArray: '8 4' }} />
        
        {/* User Location */}
        <CircleMarker center={userCenter} radius={8} pathOptions={{ color: '#ffffff', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }}>
            <Popup><div className="text-xs font-bold text-center">My Location</div></Popup>
        </CircleMarker>

        {/* Requests */}
        {requests.map(r => {
          const CatIcon = CategoryIcons[(r.category || '').toLowerCase()] || Info;
          return (
            <CircleMarker
              key={r.id}
              center={[r.location?.lat || DEFAULT_CENTER[0], r.location?.lng || DEFAULT_CENTER[1]]}
              radius={urgencyRadii[r.urgency] || 6}
              pathOptions={{ color: urgencyFills[r.urgency] || '#888', fillColor: urgencyFills[r.urgency] || '#888', fillOpacity: 0.7, weight: 2 }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <CatIcon className="w-4 h-4 text-primary" />
                    <span>{r.userId}</span>
                  </div>
                  <p>{r.description}</p>
                  <p className="opacity-70">{(r.urgency || '').toUpperCase() || 'UNKNOWN'} · {r.status}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Helpers */}
        {helpers.map(h => {
          const lat = h.location?.lat && h.location?.lat !== 0 ? h.location.lat : DEFAULT_CENTER[0] + 0.01;
          const lng = h.location?.lng && h.location?.lng !== 0 ? h.location.lng : DEFAULT_CENTER[1] + 0.01;
          return (
            <CircleMarker
              key={h.id}
              center={[lat, lng]}
              radius={6}
              pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.7, weight: 2 }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-bold flex items-center gap-1">
                    <UserIcon className="w-4 h-4 text-success" />
                    <span>{h.name}</span>
                  </div>
                  {h.skills && h.skills.length > 0 && <p className="opacity-70 mt-1">{h.skills.join(', ')}</p>}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
