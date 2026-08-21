# RouteLog — Hours of Service Trip and ELD Planner

RouteLog is a full-stack web application designed for property-carrying commercial truck drivers in the United States. Given an initial location, pickup stop, dropoff destination, and current cycle hours used, RouteLog calculates a real road route, plans required FMCSA Hours of Service (HOS) stops (including mandatory 30-minute breaks, 10-hour daily rests, fueling stops, and 34-hour cycle restarts), generates complete daily ELD log sheets with interactive 24-hour duty status charts, and visualizes the full trip on an interactive Leaflet map.

---

## 🌟 Architecture & Tech Stack

- **Frontend**: React + TypeScript / JSX + Vite + TailwindCSS + Leaflet / React-Leaflet + Lucide Icons
- **Backend**: Python + Django 5 + Django REST Framework (Stateless, No Database)
- **Maps & Geocoding**: Multi-provider architecture with automatic fallback (HERE / TomTom / OpenRouteService / OSRM & Nominatim)
- **Persistence**: Demo client-side browser localStorage (`authStorage.js`, `storage.js`) with versioned keys and isolated user scopes
- **Deployment**: Vercel ready (stateless, zero persistent local database dependencies)

---

## 📋 FMCSA Hours of Service (HOS) Compliance Rules

RouteLog strictly implements FMCSA Part 395 rules for property-carrying drivers:
1. **11-Hour Driving Limit**: A driver may drive a maximum of 11 cumulative hours after 10 consecutive hours off duty.
2. **14-Hour Duty Window**: Driving is prohibited after the 14th consecutive hour of coming on duty.
3. **30-Minute Rest Break**: A 30-consecutive-minute non-driving break is mandatory after 8 cumulative hours of driving.
4. **10-Hour Daily Rest**: Resets the 11-hour driving and 14-hour duty window limits.
5. **70-Hour / 8-Day Cycle**: Total on-duty and driving time is capped at 70 hours.
6. **34-Hour Restart Assumption**: When remaining cycle hours are insufficient for the next driving segment, a 34-consecutive-hour OFF_DUTY period is scheduled to reset the cycle to 0.

### Assessment-Specific Assumptions
- **Pickup Stop**: 1 hour ON_DUTY at pickup location.
- **Dropoff Stop**: 1 hour ON_DUTY at dropoff location.
- **Fueling Intervals**: Fuel stop scheduled at least once every 1,000 miles (targeted at 900 miles for safety), duration 30 minutes ON_DUTY.

---

## 🚀 Quick Start (Local Setup)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd eld-trip-planner/backend

# Create & activate virtual environment (optional)
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run system check & check routing providers
python manage.py check
python manage.py check_providers

# Start Django backend server
python manage.py runserver 8000
```

Backend will be accessible at: `http://localhost:8000/api/`
- Health check: `GET http://localhost:8000/api/health/`
- Location search: `GET http://localhost:8000/api/locations/search/?q=Dallas`
- Trip planner: `POST http://localhost:8000/api/trips/plan/`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd eld-trip-planner

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Frontend will run at: `http://localhost:5173/`

---

## 🔑 Environment Variables

### Backend (`.env` in `backend/` or `eld-trip-planner/backend/`)
```ini
DJANGO_SECRET_KEY=replace-with-a-long-random-secret
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,testserver,.vercel.app
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
PRIMARY_GEOCODING_PROVIDER=here
PRIMARY_ROUTING_PROVIDER=here
ENABLE_PROVIDER_FALLBACK=true
HERE_API_KEY=
TOMTOM_API_KEY=
OPENROUTESERVICE_API_KEY=
```

### Frontend (`.env` in `eld-trip-planner/`)
```ini
VITE_API_BASE_URL=/api
VITE_MAPTILER_API_KEY=
```

---

## 🧪 Testing & Validation

### Backend Tests
```bash
cd eld-trip-planner/backend
python manage.py check_providers
```

### Frontend Production Build
```bash
cd eld-trip-planner
npm run build
```

---

## 🚢 Vercel Deployment

1. Set `VITE_API_BASE_URL` in Vercel to your deployed Django backend URL (e.g. `https://your-backend.vercel.app/api`).
2. Deploy backend as serverless Python functions or Django on WSGI/ASGI serverless runtime.
3. CORS headers are automatically configured to allow your Vercel domains.
