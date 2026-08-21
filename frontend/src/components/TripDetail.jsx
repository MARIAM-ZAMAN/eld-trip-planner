// src/components/TripDetail.jsx
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ChevronLeft, FileText, Download, Edit2 } from 'lucide-react';
import { geoJsonToLeaflet, locationToLeaflet } from '../utils/mapCoordinates';
import { formatMinutesToHM } from '../utils/time';

// Fix default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Truck Icon for map center
const truckIcon = new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div class="bg-blue-600 rounded-lg p-1.5 text-white shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 12h-3V8h3l3 3-3 3z"/><path d="M10 12h8"/><rect x="3" y="6" width="12" height="12" rx="2"/><circle cx="15" cy="18" r="2"/><circle cx="5" cy="18" r="2"/></svg></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

function MapViewport({ positions }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (positions.length > 1) map.fitBounds(positions, { padding: [24, 24] });
  }, [map, positions]);
  return null;
}

export default function TripDetail({ trip, onBack, onViewDailyLogs }) {
  const route = trip.routeData || trip.route || {};
  const routePositions = route.geometry?.coordinates?.length
    ? geoJsonToLeaflet(route.geometry.coordinates)
    : route.path || [];
  const startCoords = locationToLeaflet(trip.locations?.current) || routePositions[0];
  const pickupCoords = locationToLeaflet(trip.locations?.pickup);
  const endCoords = locationToLeaflet(trip.locations?.dropoff) || routePositions[routePositions.length - 1];

  const isDisabled = trip.status === "Completed" || trip.status === "In Progress";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Top Header & Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Trip Details</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                trip.status === 'Planned' ? 'bg-blue-100 text-blue-600' : 
                trip.status === 'In Progress' ? 'bg-orange-100 text-orange-600' : 
                'bg-green-100 text-green-600'
              }`}>
                {trip.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              {trip.from || trip.formData?.currentLocation} <span className="text-slate-300 mx-1">→</span> {trip.to || trip.formData?.dropoffLocation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit button is still here, 3 dots button removed completely */}
          <button 
            disabled={isDisabled}
            className={`flex items-center gap-2 border px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isDisabled 
                ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed' 
                : 'border-blue-200 text-blue-600 hover:bg-blue-50'
            }`}
          >
            <Edit2 size={16} /> Edit Trip
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-4">
        <div className="flex gap-6 text-sm font-medium text-slate-500 overflow-x-auto pb-1">
          <button className="pb-3 text-blue-600 border-b-2 border-blue-600">Overview</button>
          <button className="pb-3 hover:text-slate-800">Route & Stops</button>
          <button className="pb-3 hover:text-slate-800">HOS Schedule</button>
          <button className="pb-3 hover:text-slate-800">Daily Logs</button>
        </div>
      </div>
      
      {/* Split Content: Left Stats, Right Map */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-5">Trip Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-sm text-slate-500">Start Date</span>
              <span className="text-sm font-medium text-slate-800">09.00 AM</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-sm text-slate-500">Distance</span>
              <span className="text-sm font-medium text-slate-800">{Math.round(route.distance_miles || route.distanceMiles || 0).toLocaleString()} mi</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-sm text-slate-500">Est. Time</span>
              <span className="text-sm font-medium text-slate-800">{trip.summary?.trip_duration_minutes ? formatMinutesToHM(trip.summary.trip_duration_minutes) : 'Not available'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-sm text-slate-500">Est. Days</span>
              <span className="text-sm font-medium text-slate-800">{trip.summary?.trip_days || 0}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-sm text-slate-500">Cycle Used</span>
              <span className="text-sm font-medium text-slate-800">{trip.formData?.cycleUsed ?? trip.cycle?.starting_cycle_hours ?? 0} hrs</span>
            </div>
          </div>
        </div>

        {/* Right Column: Map */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm h-[300px] relative">
           <MapContainer center={routePositions[Math.floor(routePositions.length / 2)] || startCoords || [39, -98]} zoom={5} style={{ height: '100%', width: '100%', borderRadius: '12px', zIndex: 10 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapViewport positions={routePositions} />
            <Polyline positions={routePositions} color="#2563EB" weight={4} />
            {startCoords && <Marker position={startCoords}><Popup>Current Location<br />{trip.locations?.current?.label}</Popup></Marker>}
            {pickupCoords && <Marker position={pickupCoords} icon={truckIcon}><Popup>Pickup<br />{trip.locations?.pickup?.label}</Popup></Marker>}
            {endCoords && <Marker position={endCoords}><Popup>Dropoff<br />{trip.locations?.dropoff?.label}</Popup></Marker>}
          </MapContainer>
        </div>
      </div>

      {/* Bottom Action Cards (Print removed) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div
          onClick={onViewDailyLogs}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><FileText size={20} /></div>
          <div><p className="text-sm font-semibold text-slate-800">View Daily Logs</p><p className="text-xs text-slate-400">See all daily logs</p></div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Download size={20} /></div>
          <div><p className="text-sm font-semibold text-slate-800">Download All Logs</p><p className="text-xs text-slate-400">Download PDF</p></div>
        </div>
      </div>

    </div>
  );
}