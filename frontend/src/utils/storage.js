const USERS_KEY = 'routelog_demo_users';
const CURRENT_USER_KEY = 'currentUser';
const ACTIVE_TRIP_KEY = 'routelog_active_trip';

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = readUsers();
  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }
  const user = { id: crypto.randomUUID(), name: name.trim(), email: normalizedEmail, password };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  setCurrentUser(user);
  return user;
}

export function authenticateUser(email, password) {
  const user = readUsers().find((item) => item.email === email.trim().toLowerCase() && item.password === password);
  if (!user) return null;
  setCurrentUser(user);
  return user;
}

export function setCurrentUser(user) {
  const profile = { ...user };
  delete profile.password;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

function tripsKey() {
  return `routelog_trips_${getCurrentUser()?.id || 'anonymous'}`;
}

const MAX_SAVED_TRIPS = 10;
const MAX_ROUTE_POINTS = 160;

function sampleRoutePath(path = []) {
  if (!Array.isArray(path) || path.length <= MAX_ROUTE_POINTS) return path;
  const step = (path.length - 1) / (MAX_ROUTE_POINTS - 1);
  return Array.from({ length: MAX_ROUTE_POINTS }, (_, index) => path[Math.round(index * step)]);
}

function compactTrip(trip) {
  const routeData = trip.routeData ? {
    ...trip.routeData,
    path: sampleRoutePath(trip.routeData.path),
    geometry: undefined,
  } : trip.routeData;
  const route = trip.route ? {
    ...trip.route,
    geometry: undefined,
  } : trip.route;

  return {
    ...trip,
    route,
    routeData,
  };
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      localStorage.removeItem(key);
      localStorage.setItem(key, JSON.stringify(value));
      return;
    }
    throw error;
  }
}

export function getSavedTrips() {
  try {
    return JSON.parse(localStorage.getItem(tripsKey()) || '[]');
  } catch {
    return [];
  }
}

export function saveTrip(trip) {
  const trips = getSavedTrips().filter((item) => item.id !== trip.id);
  const saved = compactTrip({ ...trip, createdAt: trip.createdAt || new Date().toISOString() });
  const recentTrips = [saved, ...trips.map(compactTrip)].slice(0, MAX_SAVED_TRIPS);
  writeJson(tripsKey(), recentTrips);
  writeJson(`${ACTIVE_TRIP_KEY}_${getCurrentUser()?.id || 'anonymous'}`, saved);
  return saved;
}

export function getActiveTrip() {
  try {
    return JSON.parse(localStorage.getItem(`${ACTIVE_TRIP_KEY}_${getCurrentUser()?.id || 'anonymous'}`) || 'null');
  } catch {
    return null;
  }
}

export function setActiveTrip(trip) {
  writeJson(`${ACTIVE_TRIP_KEY}_${getCurrentUser()?.id || 'anonymous'}`, compactTrip(trip));
}

export function deleteTrip(id) {
  localStorage.setItem(tripsKey(), JSON.stringify(getSavedTrips().filter((trip) => trip.id !== id)));
  if (getActiveTrip()?.id === id) localStorage.removeItem(`${ACTIVE_TRIP_KEY}_${getCurrentUser()?.id || 'anonymous'}`);
}
