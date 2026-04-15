import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { mockHelpers, categoryIcons } from '@/data/mockData';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
const CENTER: [number, number] = [28.6139, 77.2090];

const urgencyRadii: Record<string, number> = { Critical: 10, High: 8, Medium: 7, Low: 6, critical: 10, high: 8, medium: 7, low: 6, undefined: 5 };
const urgencyFills: Record<string, string> = { Critical: '#dc2626', High: '#f59e0b', Medium: '#3b82f6', Low: '#22c55e', critical: '#dc2626', high: '#f59e0b', medium: '#3b82f6', low: '#22c55e', undefined: '#888' };

export function EmergencyMap() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'posts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(liveData);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border">
      <MapContainer center={CENTER} zoom={14} className="w-full h-full" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 2km radius indicator */}
        <Circle center={CENTER} radius={2000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.04, weight: 1, dashArray: '8 4' }} />

        {/* Requests */}
        {requests.map(r => (
          <CircleMarker
            key={r.id}
            center={[r.location?.lat || CENTER[0], r.location?.lng || CENTER[1]]}
            radius={urgencyRadii[r.urgency] || 6}
            pathOptions={{ color: urgencyFills[r.urgency] || '#888', fillColor: urgencyFills[r.urgency] || '#888', fillOpacity: 0.7, weight: 2 }}
          >
            <Popup>
              <div className="text-xs space-y-1">
                <p className="font-bold">{r.category ? categoryIcons[r.category] : '🚨'} {r.userId}</p>
                <p>{r.description}</p>
                <p className="opacity-70">{r.urgency?.toUpperCase() || 'UNKNOWN'} · {r.status}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Helpers */}
        {mockHelpers.filter(h => h.isAvailable).map(h => (
          <CircleMarker
            key={h.id}
            center={[h.location.lat, h.location.lng]}
            radius={6}
            pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.7, weight: 2 }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold">🟢 {h.name}</p>
                {h.skills && <p className="opacity-70">{h.skills.join(', ')}</p>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
