import { useState, useMemo, useEffect, useRef } from 'react';
import { APIProvider, Map, useMap, useMapsLibrary, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Filter, X, Users, AlertTriangle, Activity, ShieldAlert, Flame, Info, MapPin, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserMap } from '@/hooks/useUserMap';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function HeatmapLayerComponent({ data }: { data: {lat: number, lng: number, weight?: number}[] }) {
  const map = useMap();
  const visualization = useMapsLibrary('visualization');
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);

  useEffect(() => {
    if (!map || !visualization) return;
    
    heatmapRef.current = new visualization.HeatmapLayer({
      radius: 40,
      opacity: 0.8,
      dissipating: true,
      map: map
    });
    
    heatmapRef.current.setOptions({
      gradient: [
        'rgba(0, 0, 0, 0)',
        'rgba(34, 197, 94, 0.9)',
        'rgba(234, 179, 8, 0.9)',
        'rgba(249, 115, 22, 1)',
        'rgba(220, 38, 38, 1)'
      ],
      maxIntensity: 10
    });

    return () => {
      heatmapRef.current?.setMap(null);
    };
  }, [map, visualization]);

  useEffect(() => {
    if (!heatmapRef.current || !window.google) return;
    const heatmapData = data.map(point => ({
      location: new window.google.maps.LatLng(point.lat, point.lng),
      weight: point.weight || 1
    }));
    heatmapRef.current.setData(heatmapData);
  }, [data]);

  return null;
}

export function CrisisHeatMap({ requests, helpers }: { requests: any[], helpers: any[] }) {
  const [filter, setFilter] = useState('All');
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const { getUserName } = useUserMap();

  const categories = ['All', 'Medical', 'Rescue', 'Women_Safety', 'Fire', 'General'];

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLastUpdated(new Date());
    const active = requests.filter(r => r.location?.lat && r.location?.lng);
    if (active.length > 0) {
      const urgent = active.filter(r => ['critical', 'high'].includes((r.urgency || '').toLowerCase()));
      const target = urgent.length > 0 ? urgent : active;
      const avgLat = target.reduce((s, r) => s + r.location.lat, 0) / target.length;
      const avgLng = target.reduce((s, r) => s + r.location.lng, 0) / target.length;
      setCenter({ lat: avgLat, lng: avgLng });
    }
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (filter === 'All') return requests;
    return requests.filter(r => (r.category || '').toLowerCase() === filter.toLowerCase());
  }, [requests, filter]);

  const heatmapPoints = useMemo(() => {
    return filteredRequests.filter(r => r.location?.lat && r.location?.lng).map(r => {
      let weight = 1;
      const urg = (r.urgency || '').toLowerCase();
      if (urg === 'critical') weight = 10;
      else if (urg === 'high') weight = 6;
      else if (urg === 'medium') weight = 3;
      return { lat: r.location.lat, lng: r.location.lng, weight };
    });
  }, [filteredRequests]);

  const maxDensityCount = useMemo(() => {
    if (filteredRequests.length === 0) return 0;
    let max = 0;
    for (const r1 of filteredRequests) {
      if (!r1.location) continue;
      let count = 0;
      for (const r2 of filteredRequests) {
        if (!r2.location) continue;
        if (getDistance(r1.location.lat, r1.location.lng, r2.location.lat, r2.location.lng) < 3.0) count++;
      }
      max = Math.max(max, count);
    }
    return max;
  }, [filteredRequests]);

  const handleMapClick = (e: any) => {
    if (!e.detail.latLng) return;
    const { lat, lng } = e.detail.latLng;
    const matched = filteredRequests.filter(r => r.location && getDistance(lat, lng, r.location.lat, r.location.lng) <= 2.5);
    if (matched.length > 0) {
      const breakdown = matched.reduce((acc: any, curr: any) => {
        const c = curr.category || 'other';
        acc[c] = (acc[c] || 0) + 1;
        return acc;
      }, {});
      const latest = new Date(Math.max(...matched.map(r => new Date(r.createdAt || 0).getTime())));
      const nearbyH = helpers.filter(h => h.location && getDistance(lat, lng, h.location.lat, h.location.lng) <= 2.5).length;
      setPopupInfo({ lat: matched[0].location.lat, lng: matched[0].location.lng, count: matched.length, breakdown, latestTime: latest, nearbyHelpers: nearbyH });
    } else {
      setPopupInfo(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[520px] mb-6">
      <div className="p-4 border-b border-border bg-background/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-sos animate-pulse" />
            Live Crisis Analytics
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            REAL-TIME TRACKING ACTIVE <span className="opacity-30">|</span> LAST SYNC: {Math.max(0, Math.floor((now.getTime() - lastUpdated.getTime()) / 1000))}s AGO
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => { setFilter(c); setPopupInfo(null); }}
              className={`px-3 py-1.5 rounded-full text-[10px] uppercase font-bold transition-all border ${filter === c ? 'bg-sos text-white border-sos shadow-lg shadow-sos/20' : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'}`}
            >
              {c.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-background/20 py-2.5">
        <div className="text-center px-1">
          <p className="text-[9px] uppercase text-muted-foreground font-bold tracking-widest">Active Hits</p>
          <p className="font-mono font-bold text-sm">{filteredRequests.length}</p>
        </div>
        <div className="text-center px-1">
          <p className="text-[9px] uppercase text-muted-foreground font-bold tracking-widest">Peak Density</p>
          <p className="font-mono font-bold text-sm text-warning">{maxDensityCount} <span className="text-[10px] font-sans opacity-50 font-normal">pts/3km²</span></p>
        </div>
        <div className="text-center px-1">
          <p className="text-[9px] uppercase text-muted-foreground font-bold tracking-widest">Responders</p>
          <p className="font-mono font-bold text-sm text-success">{helpers.length}</p>
        </div>
      </div>

      <div className="flex-1 relative">
        <APIProvider apiKey={GOOGLE_MAPS_KEY} libraries={['visualization']}>
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setCenter(requests[0]?.location || DEFAULT_CENTER)}
              className="bg-background/90 backdrop-blur border border-border p-2 rounded-lg shadow-xl text-foreground hover:bg-secondary transition-all flex items-center gap-2 text-[10px] font-bold"
            >
              <Compass className="w-3.5 h-3.5 text-sos animate-pulse" /> RE-CENTER
            </button>
          </div>
          <Map
            mapId="crisis_map_main"
            center={center}
            onCenterChanged={(e: any) => setCenter(e.detail.center)}
            defaultZoom={11}
            disableDefaultUI={true}
            gestureHandling="greedy"
            onClick={handleMapClick}
            styles={[{ elementType: 'geometry', stylers: [{ color: '#1a1f24' }] }, { elementType: 'labels.text.fill', stylers: [{ color: '#8e9eab' }] }, { featureType: 'water', stylers: [{ color: '#0d1115' }] }]}
          >
            <HeatmapLayerComponent data={heatmapPoints} />
            {helpers.map(h => h.location?.lat && (
              <AdvancedMarker key={h.id} position={{ lat: h.location.lat, lng: h.location.lng }}>
                <div className="relative group">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                  <div className="absolute hidden group-hover:block bottom-5 left-1/2 -translate-x-1/2 bg-popover border border-border px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap shadow-2xl z-50">
                    {h.name || 'Helper'}
                  </div>
                </div>
              </AdvancedMarker>
            ))}
            {popupInfo && (
              <AdvancedMarker position={{ lat: popupInfo.lat, lng: popupInfo.lng }}>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border shadow-2xl rounded-xl p-4 w-[260px] z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-sos" />
                      <span className="font-bold text-xs uppercase tracking-wider">Hotspot Info</span>
                    </div>
                    <button onClick={() => setPopupInfo(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Requests</span>
                      <span className="font-bold text-sos">{popupInfo.count} active</span>
                    </div>
                    <div className="p-2 bg-secondary/30 rounded-lg text-[10px] space-y-1">
                      {Object.entries(popupInfo.breakdown).map(([c, count]: any) => (
                        <div key={c} className="flex justify-between uppercase font-bold opacity-70">
                          <span>{c}</span><span>{count}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-muted-foreground">Nearby Helpers</span>
                      <span className="text-success font-bold">{popupInfo.nearbyHelpers} online</span>
                    </div>
                  </div>
                </div>
              </AdvancedMarker>
            )}
          </Map>

          <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur border border-border p-2.5 rounded-xl shadow-2xl z-10 space-y-2">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-1 mb-1">Impact Level</p>
            <div className="flex flex-col gap-1.5">
              {[ {c: 'bg-emerald-500', l: 'Low'}, {c: 'bg-yellow-500', l: 'Medium'}, {c: 'bg-red-500', l: 'Critical'} ].map(i => (
                <div key={i.l} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${i.c}`} />
                  <span className="text-[10px] font-bold opacity-70">{i.l}</span>
                </div>
              ))}
            </div>
          </div>
        </APIProvider>
      </div>
    </div>
  );
}
