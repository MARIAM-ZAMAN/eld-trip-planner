import { useEffect, useMemo, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { searchLocations } from '../utils/api';
import { US_STATES } from '../constants/usStates.ts';

function normalizeLocation(location) {
  return {
    ...location,
    type: location.type || 'location',
    stateCode: location.stateCode || location.state_code,
    country: location.country || 'United States',
    countryCode: location.countryCode || location.country_code || 'US',
  };
}

export default function LocationAutocomplete({ value, onChange, onSelect, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestId = useRef(0);
  const containerRef = useRef(null);

  const states = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [];
    return US_STATES.filter((state) => state.name.toLowerCase().startsWith(query) || state.code.toLowerCase().startsWith(query));
  }, [value]);

  useEffect(() => {
    const query = value.trim();
    const currentRequest = ++requestId.current;
    if (query.length < 2) {
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError('');
      try {
        const results = await searchLocations(query, { signal: controller.signal });
        if (currentRequest === requestId.current) setLocations(results.map(normalizeLocation));
      } catch (requestError) {
        if (requestError.name !== 'AbortError' && currentRequest === requestId.current) {
          setLocations([]);
          setError('Location search is temporarily unavailable. Please try again.');
        }
      } finally {
        if (currentRequest === requestId.current) setIsLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const displayedResults = [
    ...states.map((state) => ({
      type: 'state',
      label: state.label,
      name: state.name,
      state: state.name,
      stateCode: state.code,
      country: 'United States',
      countryCode: 'US',
      latitude: state.latitude,
      longitude: state.longitude,
    })),
    ...locations.map((location) => normalizeLocation(location)),
  ];

  const safeActiveIndex = activeIndex >= displayedResults.length ? -1 : activeIndex;

  const handleSelectLocation = async (suggestion) => {
    setError('');
    setIsOpen(false);
    setActiveIndex(-1);

    if (suggestion.type === 'state') {
      onChange(suggestion.label);
      if (Number.isFinite(suggestion.latitude) && Number.isFinite(suggestion.longitude)) {
        onSelect(suggestion);
        return;
      }
      setIsLoading(true);
      try {
        const resolved = (await searchLocations(suggestion.name)).map(normalizeLocation).find(
          (location) => Number.isFinite(location.latitude) && Number.isFinite(location.longitude),
        );
        if (!resolved) {
          setError('Location search is temporarily unavailable. Please try again.');
          return;
        }
        onSelect({ ...resolved, label: suggestion.label, type: 'state' });
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError('Location search is temporarily unavailable. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    onSelect(suggestion);
  };

  const selectSuggestion = (suggestion) => {
    if (!suggestion) return;
    handleSelectLocation(suggestion);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (!isOpen && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      setIsOpen(true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min((index >= displayedResults.length ? -1 : index) + 1, displayedResults.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max((index >= displayedResults.length ? 0 : index) - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      selectSuggestion(displayedResults[safeActiveIndex >= 0 ? safeActiveIndex : 0]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const showDropdown = isOpen && value.trim() && (displayedResults.length || isLoading || error || value.trim().length >= 1);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue);
          if (nextValue.trim().length < 3) {
            setLocations([]);
            setIsLoading(false);
            setError('');
          }
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        className={className}
        role="combobox"
        aria-expanded={Boolean(showDropdown)}
        aria-autocomplete="list"
        aria-controls="location-suggestions"
        aria-activedescendant={safeActiveIndex >= 0 ? `location-suggestion-${safeActiveIndex}` : undefined}
      />
      {showDropdown && (
        <div id="location-suggestions" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {states.length > 0 && <p className="px-4 py-2 text-[10px] font-bold tracking-wide text-slate-400">STATES</p>}
          {displayedResults.slice(0, states.length).map((suggestion, index) => (
            <button
              type="button"
              role="option"
              id={`location-suggestion-${index}`}
              aria-selected={index === safeActiveIndex}
              key={`${suggestion.type}-${suggestion.label}`}
              onMouseDown={(event) => {
                event.preventDefault();
                selectSuggestion(suggestion);
              }}
              className={`block w-full px-4 py-2 text-left text-sm ${index === safeActiveIndex ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              {suggestion.label}
            </button>
          ))}
          {locations.length > 0 && <p className="px-4 py-2 text-[10px] font-bold tracking-wide text-slate-400">LOCATIONS</p>}
          {displayedResults.slice(states.length).map((location, index) => {
            const suggestionIndex = states.length + index;
            return (
              <button
                type="button"
                role="option"
                id={`location-suggestion-${suggestionIndex}`}
                aria-selected={suggestionIndex === safeActiveIndex}
                key={`location-${location.label}-${location.latitude}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectSuggestion(location);
                }}
                className={`block w-full px-4 py-2 text-left text-sm ${suggestionIndex === safeActiveIndex ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                {location.label}
              </button>
            );
          })}
          {isLoading && <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-400"><LoaderCircle size={14} className="animate-spin" /> Searching locations...</div>}
          {!isLoading && !displayedResults.length && !error && value.trim().length >= 1 && <div className="px-4 py-2 text-xs text-slate-500">No US locations found.</div>}
          {error && <div className="px-4 py-2 text-xs text-red-600">{error}</div>}
        </div>
      )}
    </div>
  );
}
