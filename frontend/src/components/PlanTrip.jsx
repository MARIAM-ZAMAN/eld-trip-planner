import { useState } from "react";
import { MapPin, Calendar, Clock, Info, ChevronRight, ArrowRight, ChevronDown, Check } from "lucide-react";
import { planTrip, searchLocations } from "../utils/api";
import { US_STATES } from "../constants/usStates.ts";
import LocationAutocomplete from "./LocationAutocomplete";

export default function PlanTrip({ onTripGenerated }) {
  const [currentLocation, setCurrentLocation] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [selectedLocations, setSelectedLocations] = useState({ current: null, pickup: null, dropoff: null });
  const [cycleUsed, setCycleUsed] = useState(0);
  const [pickupDuration, setPickupDuration] = useState(1); 
  const [dropoffDuration, setDropoffDuration] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const totalCycle = 70;
  const remaining = totalCycle - cycleUsed;
  const radius = 34;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (remaining / totalCycle) * circumference;

  const resolveLocation = async (key, rawText, selected) => {
    if (selected && Number.isFinite(selected.latitude) && Number.isFinite(selected.longitude)) {
      return selected;
    }
    const query = (rawText || "").trim();
    if (!query) {
      const fieldName = key === 'current' ? 'Current' : key === 'pickup' ? 'Pickup' : 'Dropoff';
      throw new Error(`Please provide a valid ${fieldName} Location.`);
    }

    const qLower = query.toLowerCase();
    const stateMatch = US_STATES.find(
      (s) => s.name.toLowerCase() === qLower || s.code.toLowerCase() === qLower || s.label.toLowerCase() === qLower
    );
    if (stateMatch) {
      const stateObj = {
        label: stateMatch.label,
        name: stateMatch.name,
        state: stateMatch.name,
        stateCode: stateMatch.code,
        latitude: stateMatch.latitude,
        longitude: stateMatch.longitude,
        country: 'United States',
        countryCode: 'US',
        type: 'state',
      };
      selectLocation(key, stateObj);
      return stateObj;
    }

    try {
      const results = await searchLocations(query);
      if (results && results.length > 0) {
        const best = results[0];
        selectLocation(key, best);
        return best;
      }
    } catch {
      // ignore
    }

    throw new Error(`Could not find a valid US location for "${query}". Please choose from the suggestions.`);
  };

  // --- MAIN GENERATION LOGIC ---
  const generateTrip = async () => {
    setErrorMessage('');
    setIsGenerating(true);
    try {
      const current = await resolveLocation('current', currentLocation, selectedLocations.current);
      const pickup = await resolveLocation('pickup', pickupLocation, selectedLocations.pickup);
      const dropoff = await resolveLocation('dropoff', dropoffLocation, selectedLocations.dropoff);

      if (!Number.isFinite(cycleUsed) || cycleUsed < 0 || cycleUsed > 70) {
        throw new Error('Cycle hours must be between 0 and 70.');
      }
      const result = await planTrip({
        current_location: current,
        pickup_location: pickup,
        dropoff_location: dropoff,
        current_cycle_hours: cycleUsed,
      });
      onTripGenerated(result);
    } catch (error) {
      setErrorMessage(error.message || 'We could not calculate this route. Check the locations and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateLocation = (key, value) => {
    const setters = { current: setCurrentLocation, pickup: setPickupLocation, dropoff: setDropoffLocation };
    setters[key](value);
    setSelectedLocations((locations) => ({ ...locations, [key]: null }));
  };

  const selectLocation = (key, location) => {
    const setters = { current: setCurrentLocation, pickup: setPickupLocation, dropoff: setDropoffLocation };
    setters[key](location.label);
    setSelectedLocations((locations) => ({ ...locations, [key]: location }));
  };

  const locationInputClass = "w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span>Dashboard</span> <ChevronRight size={14} /> <span className="text-slate-800 font-semibold">Plan New Trip</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Plan Your Trip</h1>
        <p className="text-sm text-slate-400 mt-1">Enter your trip details and we’ll generate the best route, schedule, and daily logs for you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 items-start">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1.5">Current Location</label>
              <div className="relative">
                <LocationAutocomplete value={currentLocation} onChange={(value) => updateLocation('current', value)} onSelect={(location) => selectLocation('current', location)} className={locationInputClass} />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1.5">Pickup Location</label>
              <div className="relative">
                <LocationAutocomplete value={pickupLocation} onChange={(value) => updateLocation('pickup', value)} onSelect={(location) => selectLocation('pickup', location)} className={locationInputClass} />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <Clock size={14} className="text-slate-400" />
                <span className="text-sm text-slate-500">Pickup Duration:</span>
                <input type="number" value={pickupDuration} onChange={(e) => setPickupDuration(Number(e.target.value))} className="w-14 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm focus:outline-none focus:border-blue-500" min="0" />
                <span className="text-sm text-slate-500">hour</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1.5">Dropoff Location</label>
              <div className="relative">
                <LocationAutocomplete value={dropoffLocation} onChange={(value) => updateLocation('dropoff', value)} onSelect={(location) => selectLocation('dropoff', location)} className={locationInputClass} />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <Clock size={14} className="text-slate-400" />
                <span className="text-sm text-slate-500">Dropoff Duration:</span>
                <input type="number" value={dropoffDuration} onChange={(e) => setDropoffDuration(Number(e.target.value))} className="w-14 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm focus:outline-none focus:border-blue-500" min="0" />
                <span className="text-sm text-slate-500">hour</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1.5"><Calendar size={16} className="text-blue-600" /> Current Cycle Used</label>
              <div className="flex items-center gap-4">
                <input type="number" value={cycleUsed} onChange={(e) => setCycleUsed(Number(e.target.value))} className="w-20 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" min="0" max={totalCycle} />
                <span className="text-sm text-slate-500">hours</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Enter the on-duty hours already used in your current 8-day cycle.</p>
            </div>
          </div>

          <div className="flex justify-start pt-2">
            <button onClick={generateTrip} disabled={isGenerating} className={`flex items-center gap-2 text-white font-medium px-8 py-3 rounded-xl shadow-sm shadow-blue-600/20 transition-all ${isGenerating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isGenerating ? 'Generating Route...' : 'Generate Trip Plan'} {!isGenerating && <ArrowRight size={18} />}
            </button>
          </div>
          {errorMessage && <p role="alert" className="text-sm text-red-600">{errorMessage}</p>}
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Trip Summary</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3"><div className={`w-5 h-5 rounded-full ${selectedLocations.current ? 'bg-emerald-500' : 'bg-slate-300'} flex items-center justify-center shrink-0 mt-0.5`}><Check size={12} className="text-white" /></div><div><p className="text-xs text-slate-400 uppercase tracking-wide">Current Location</p><p className="text-sm font-medium text-slate-800">{selectedLocations.current?.label || 'Not selected'}</p></div></div>
              <div className="flex items-start gap-3"><div className={`w-5 h-5 rounded-full ${selectedLocations.pickup ? 'bg-blue-500' : 'bg-slate-300'} flex items-center justify-center shrink-0 mt-0.5`}><MapPin size={12} className="text-white" /></div><div><p className="text-xs text-slate-400 uppercase tracking-wide">Pickup Location</p><p className="text-sm font-medium text-slate-800">{selectedLocations.pickup?.label || 'Not selected'}</p></div></div>
              <div className="flex items-start gap-3"><div className={`w-5 h-5 rounded-full ${selectedLocations.dropoff ? 'bg-orange-500' : 'bg-slate-300'} flex items-center justify-center shrink-0 mt-0.5`}><MapPin size={12} className="text-white" /></div><div><p className="text-xs text-slate-400 uppercase tracking-wide">Dropoff Location</p><p className="text-sm font-medium text-slate-800">{selectedLocations.dropoff?.label || 'Not selected'}</p></div></div>
              <div className="flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center shrink-0 mt-0.5"><Clock size={12} className="text-white" /></div><div><p className="text-xs text-slate-400 uppercase tracking-wide">Cycle Used</p><p className="text-sm font-medium text-slate-800">{cycleUsed.toFixed(1)} hrs</p></div></div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs font-medium text-slate-700 mb-2 text-left">Cycle Remaining</p>
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg width="100%" height="100%" viewBox="0 0 80 80" className="transform -rotate-90">
                    <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-slate-100" />
                    <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="text-emerald-500 transition-all duration-1000 ease-in-out" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-bold text-emerald-600 leading-none">{remaining.toFixed(1)}</span><span className="text-[10px] text-slate-400 font-medium">hrs</span></div>
                </div>
                <p className="text-xs text-slate-400 mt-1">out of {totalCycle} hrs</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5"><Info size={14} /></div>
              <div><p className="text-sm font-semibold text-blue-800">What's Current Cycle Used?</p><p className="text-xs text-blue-700/80 mt-1">Enter the on-duty hours you've already used in your current 8-day cycle. New drivers can enter 0.</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}