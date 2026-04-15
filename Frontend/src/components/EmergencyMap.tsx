import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { mockRequests, mockHelpers, categoryIcons } from '@/data/mockData';

const CENTER: [number, number] = [28.6139, 77.2090];

const urgencyRadii: Record<string, number> = { critical: 10, high: 8, medium: 7, low: 6 };
const urgencyFills: Record<string, string> = { critical: '#dc2626', high: '#f59e0b', medium: '#3b82f6', low: '#22c55e' };

export function EmergencyMap() {
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
        {mockRequests.map(r => (
          <CircleMarker
            key={r.id}
            center={[r.location.lat, r.location.lng]}
            radius={urgencyRadii[r.urgency]}
            pathOptions={{ color: urgencyFills[r.urgency], fillColor: urgencyFills[r.urgency], fillOpacity: 0.7, weight: 2 }}
          >
            <Popup>
              <div className="text-xs space-y-1">
                <p className="font-bold">{categoryIcons[r.category]} {r.userName}</p>
                <p>{r.description}</p>
                <p className="opacity-70">{r.urgency.toUpperCase()} · {r.status}</p>
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
