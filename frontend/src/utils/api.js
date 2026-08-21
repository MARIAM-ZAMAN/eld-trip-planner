const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || payload.detail || 'The trip could not be calculated.');
  }
  return payload;
}

export function planTrip(payload) {
  return request('/trips/plan/', { method: 'POST', body: JSON.stringify(payload) });
}

const locationSearchCache = new Map();

export async function searchLocations(query, options = {}) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  // Check cache first (ignore cache if custom signal or options passed that shouldn't be cached)
  if (locationSearchCache.has(normalizedQuery) && !options.signal) {
    return locationSearchCache.get(normalizedQuery);
  }

  const results = await request(`/locations/search/?q=${encodeURIComponent(query)}`, options);
  if (Array.isArray(results) && results.length > 0) {
    // Keep cache bounded to 100 entries
    if (locationSearchCache.size >= 100) {
      const firstKey = locationSearchCache.keys().next().value;
      locationSearchCache.delete(firstKey);
    }
    locationSearchCache.set(normalizedQuery, results);
  }
  return results;
}

export { API_BASE_URL };
