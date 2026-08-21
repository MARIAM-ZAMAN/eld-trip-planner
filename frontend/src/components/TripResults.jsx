// src/components/TripResults.jsx
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, MapPin, ChevronRight, Calendar, Users } from "lucide-react";
import L from 'leaflet';
import HOSSchedule from "./HOSSchedule";
import { geoJsonToLeaflet, locationToLeaflet } from '../utils/mapCoordinates';
import { formatMinutesToHM } from '../utils/time';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const markerIcon = (color) => new L.DivIcon({
  className: 'routelog-marker',
  html: `<div style="background:${color};width:18px;height:18px;border:3px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(15,23,42,.4)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const markerIcons = {
  current: markerIcon('#16a34a'),
  pickup: markerIcon('#f97316'),
  dropoff: markerIcon('#dc2626'),
  FUEL: markerIcon('#9333ea'),
  BREAK: markerIcon('#64748b'),
  DAILY_REST: markerIcon('#2563eb'),
  CYCLE_RESTART: markerIcon('#0891b2'),
};

const STATUS_BADGE = {
  PICKUP:        ['Pickup',  'bg-orange-100 text-orange-700'],
  DROPOFF:       ['Drop-off','bg-red-100 text-red-700'],
  FUEL:          ['Fuel',    'bg-purple-100 text-purple-700'],
  BREAK:         ['Break',   'bg-gray-100 text-gray-700'],
  DAILY_REST:    ['Rest',    'bg-blue-100 text-blue-700'],
  CYCLE_RESTART: ['Restart', 'bg-cyan-100 text-cyan-700'],
  DRIVING:       ['Driving', 'bg-indigo-100 text-indigo-700'],
  TRIP_END:      ['Done',    'bg-green-100 text-green-700'],
};

const StatusBadge = ({ type }) => {
  const [label, cls] = STATUS_BADGE[type] || [type, 'bg-slate-100 text-slate-700'];
  return <span className={`px-3 py-1 rounded-full text-xs font-bold ${cls}`}>{label}</span>;
};

/** Format an ISO datetime string (or minute offset) to a readable local time. */
function fmtTime(isoStr) {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(isoStr);
  }
}

function MapViewport({ positions }) {
  const map = useMap();
  useEffect(() => {
    const resizeAndFit = () => {
      map.invalidateSize();
      if (positions.length > 1) map.fitBounds(positions, { padding: [24, 24] });
    };
    resizeAndFit();
    window.addEventListener('resize', resizeAndFit);
    return () => window.removeEventListener('resize', resizeAndFit);
  }, [map, positions]);
  return null;
}

function stopPosition(stop) {
  return locationToLeaflet(stop.coordinate || stop.coords);
}

// ============= SUB COMPONENTS FOR TABS =============

function TripTimeline({ stops }) {
  return (
    <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
      {stops.map((stop, index) => (
        <div key={index} className="relative pl-6">
          <div className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ${
            stop.type === 'DAILY_REST' ? 'bg-blue-500'
            : stop.type === 'BREAK'    ? 'bg-gray-500'
            : stop.type === 'DROPOFF'  ? 'bg-red-500'
            : stop.type === 'FUEL'     ? 'bg-purple-500'
            : 'bg-blue-500'
          }`} />
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500">{fmtTime(stop.time || stop.start_time)}</span>
              <StatusBadge type={stop.type} />
            </div>
            <p className="text-sm font-medium text-slate-800 mt-1">{stop.label}</p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <MapPin size={12} /> {stop.location || "En Route"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TripDetails({ formData, routeData, cycle = {} }) {
  const { currentLocation, pickupLocation, dropoffLocation, cycleUsed = 0 } = formData;
  const remainingCycle = cycle.remaining_cycle_hours ?? Math.max(0, 70 - cycleUsed);

  const detailItems = [
    { label: "Driver Name",      value: "John Driver",                                    icon: Users },
    { label: "Total Distance",   value: `${Math.round(routeData.distanceMiles || 0).toLocaleString()} mi`, icon: MapPin },
    { label: "Est. Driving Time",value: formatMinutesToHM(routeData.durationMinutes || 0),icon: Clock },
    { label: "Current Location", value: currentLocation,                                  icon: MapPin },
    { label: "Pickup Location",  value: pickupLocation,                                   icon: MapPin },
    { label: "Dropoff Location", value: dropoffLocation,                                  icon: MapPin },
    { label: "Cycle Used",       value: `${(+cycleUsed || 0).toFixed(1)} hrs`,           icon: Calendar },
    { label: "Remaining Cycle",  value: `${(+remainingCycle || 0).toFixed(1)} hrs`,      icon: Clock, highlight: true },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {detailItems.map((item, index) => (
        <div key={index} className={`flex items-start gap-3 p-4 rounded-xl border ${item.highlight ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-white'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.highlight ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
            <item.icon size={16} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{item.label}</p>
            <p className={`text-sm font-semibold ${item.highlight ? 'text-emerald-700' : 'text-slate-800'}`}>{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================

export default function TripResults({
  formData       = {},
  routeData      = {},
  stops          = [],
  events         = [],
  summary        = {},
  cycle          = {},
  onViewDailyLogs,
}) {
  const TOTAL_CYCLE = 70;
  const mapTilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
  const tileUrl = mapTilerKey
    ? `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${mapTilerKey}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttribution = mapTilerKey
    ? '&copy; MapTiler &copy; OpenStreetMap contributors'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  const [activeTab, setActiveTab] = useState("stops");

  if (!routeData || (!routeData.distanceMiles && !routeData.distance_miles)) {
    return <div className="p-10 text-center text-slate-500">Loading Trip Details...</div>;
  }

  const { currentLocation = '', dropoffLocation = '', cycleUsed = 0 } = formData;
  const remainingCycle = cycle.remaining_cycle_hours ?? Math.max(0, TOTAL_CYCLE - cycleUsed);

  const routePositions = routeData.geometry?.coordinates?.length
    ? geoJsonToLeaflet(routeData.geometry.coordinates)
    : (routeData.path || []);
  const currentPosition = locationToLeaflet(routeData.locations?.current) || routePositions[0];
  const pickupPosition  = locationToLeaflet(routeData.locations?.pickup);
  const dropoffPosition = locationToLeaflet(routeData.locations?.dropoff) || routePositions[routePositions.length - 1];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span>Dashboard</span> <ChevronRight size={14} /> <span className="text-slate-800 font-semibold">Trip Results</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-slate-900">
          {currentLocation}
          <span className="text-blue-500 font-medium mx-2">→</span>
          {dropoffLocation}
        </h1>
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-green-200">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> HOS Compliant
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div><p className="text-lg font-bold text-slate-800">{Math.round(routeData.distanceMiles || 0).toLocaleString()} mi</p><p className="text-xs text-slate-500">Total Distance</p></div>
        <div><p className="text-lg font-bold text-slate-800">{formatMinutesToHM(routeData.durationMinutes || 0)}</p><p className="text-xs text-slate-500">Est. Drive Time</p></div>
        <div><p className="text-lg font-bold text-slate-800">{summary.trip_days || formData.tripDays || 0} Days</p><p className="text-xs text-slate-500">Total Duration</p></div>
        <div><p className="text-lg font-bold text-emerald-600">{(+remainingCycle || 0).toFixed(1)} hrs</p><p className="text-xs text-slate-500">Cycle Remaining</p></div>
      </div>

      {/* MAP */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-[350px] relative">
        {routePositions.length > 0 && (
          <MapContainer center={routePositions[Math.floor(routePositions.length / 2)]} zoom={6} style={{ height: '100%', width: '100%', zIndex: 10 }}>
            <TileLayer attribution={tileAttribution} url={tileUrl} />
            <MapViewport positions={routePositions} />
            <Polyline positions={routePositions} color="#2563EB" weight={5} />
            {currentPosition && <Marker position={currentPosition} icon={markerIcons.current}><Popup>Current Location<br />{currentLocation}</Popup></Marker>}
            {pickupPosition  && <Marker position={pickupPosition}  icon={markerIcons.pickup}><Popup>Pickup<br />{formData.pickupLocation}<br />1 hour</Popup></Marker>}
            {dropoffPosition && <Marker position={dropoffPosition} icon={markerIcons.dropoff}><Popup>Drop-off<br />{dropoffLocation}<br />1 hour</Popup></Marker>}
            {stops.map((stop, i) => {
              const position = stopPosition(stop);
              return position && !['DRIVING', 'PICKUP', 'DROPOFF', 'TRIP_END'].includes(stop.type) && (
                <Marker key={`${stop.type}-${i}`} position={position} icon={markerIcons[stop.type] || markerIcons.BREAK}>
                  <Popup>{stop.label}<br />{stop.location || 'On route'}<br />{stop.durationHours ? `${stop.durationHours.toFixed(1)} hrs` : ''}</Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="border-b pb-3 mb-6 flex flex-wrap gap-6 text-sm">
          {["stops", "hos-schedule", "timeline", "details"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`capitalize font-medium pb-3 ${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-800"}`}>
              {tab === 'hos-schedule' ? 'HOS Schedule' : tab.replace("-", " & ")}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        {activeTab === "stops" && (
          <div className="space-y-4">
            {stops.length === 0
              ? <p className="text-sm text-slate-400 text-center py-8">No stops to display. Generate a trip first.</p>
              : stops.map((stop, i) => (
              <div key={i} className="flex items-start gap-4 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 font-bold text-xs">{i + 1}</div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-slate-800">{stop.label}</p>
                    <StatusBadge type={stop.type} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={14} /> {fmtTime(stop.time || stop.start_time)}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {stop.location || 'En Route'}</span>
                    {stop.durationHours > 0 && <span className="text-slate-400">({stop.durationHours.toFixed(1)}h)</span>}
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap justify-center sm:justify-start gap-4">
              <button className="w-40 border border-blue-600 text-blue-600 font-medium py-2.5 rounded-xl hover:bg-blue-50 transition">Download Plan</button>
              {onViewDailyLogs && (
                <button
                  onClick={onViewDailyLogs}
                  className="w-40 bg-blue-600 text-white font-medium py-2.5 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition"
                >
                  View Daily Logs
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === "hos-schedule" && (
          <HOSSchedule
            events={events}
            stops={stops}
            cycleUsed={+cycleUsed || 0}
            totalCycle={TOTAL_CYCLE}
            summary={summary}
            cycle={cycle}
          />
        )}

        {activeTab === "timeline" && <TripTimeline stops={stops} />}
        {activeTab === "details" && <TripDetails formData={formData} routeData={routeData} cycle={cycle} />}
      </div>
    </div>
  );
}