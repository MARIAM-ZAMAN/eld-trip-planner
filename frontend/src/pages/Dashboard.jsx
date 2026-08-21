// src/pages/Dashboard.jsx
import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, LayoutDashboard, MapPinned, Route,
  FileClock, Settings, Truck, Clock, ShieldCheck,
  ChevronRight, LogOut, List, Menu, X,
} from "lucide-react";

import logo from "../assets/logo.webp";
import PlanTrip from "../components/PlanTrip";
import MyTrips from "../components/MyTrips";
import SettingsComponent from "../components/Settings";

const TripResults = lazy(() => import("../components/TripResults"));
const TripDetail  = lazy(() => import("../components/TripDetail"));
const DailyLogs   = lazy(() => import("../components/DailyLogs"));

import {
  clearCurrentUser, getActiveTrip, getCurrentUser,
  getSavedTrips, saveTrip, setActiveTrip,
} from "../utils/storage";

// ─── small internal UI pieces ─────────────────────────────────────────────────
function CycleGauge({ used, total }) {
  const radius        = 32;
  const circumference = 2 * Math.PI * radius;
  const offset        = circumference - ((used / total) * circumference);
  return (
    <div className="relative flex items-center justify-center">
      <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
        <circle className="text-slate-200" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="40" cy="40" />
        <circle className="text-emerald-500 transition-all duration-1000 ease-in-out" strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="40" cy="40" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-lg font-bold text-slate-800">{used}</span>
        <span className="text-[10px] text-slate-500 font-medium">hrs</span>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  let cls = "bg-slate-100 text-slate-600";
  const s = (status || "").toLowerCase();
  if (s === "completed")                          cls = "bg-emerald-100 text-emerald-700";
  else if (s === "in progress" || s === "active") cls = "bg-blue-100 text-blue-700";
  else if (s === "planned")                       cls = "bg-purple-100 text-purple-700";
  else if (s === "pending")                       cls = "bg-amber-100 text-amber-700";
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${cls} shrink-0`}>
      {status}
    </span>
  );
}

function tripListItem(trip) {
  return {
    ...trip,
    from:     trip.from     || trip.formData?.currentLocation || trip.locations?.current?.label || "Current",
    to:       trip.to       || trip.formData?.dropoffLocation || trip.locations?.dropoff?.label || "Dropoff",
    date:     trip.date     || (trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : "Planned"),
    status:   trip.status   || "Planned",
    duration: trip.duration || `${trip.summary?.trip_days || 0} Days`,
  };
}

const Spinner = () => (
  <div className="p-12 flex flex-col items-center justify-center min-h-[300px]">
    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
    <p className="text-sm font-medium text-slate-500">Loading view...</p>
  </div>
);

// ─── Reusable sidebar nav list ─────────────────────────────────────────────────
function SidebarNav({ navItems, view, onNav, onLogout }) {
  return (
    <>
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(({ label, icon: Icon, key }) => (
          <button
            key={key}
            onClick={() => onNav(key)}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 text-left w-full ${
              view === key
                ? "bg-white/10 text-white"
                : "text-blue-100/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon
              size={18}
              className={view === key ? "text-white" : "text-blue-200/50 group-hover:text-white"}
            />
            {label}
          </button>
        ))}
      </nav>

      <div className="pt-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [view, setView]               = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [tripData, setTripData]       = useState(() => getActiveTrip() || getSavedTrips()[0] || null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [recentTrips, setRecentTrips] = useState(() => getSavedTrips().map(tripListItem));

  const latestTrip   = tripData || recentTrips[0];
  const currentCycle = latestTrip?.formData?.cycleUsed ?? latestTrip?.cycle?.starting_cycle_hours ?? 0;

  const overviewStats = [
    { value: recentTrips.length, label: "Trips Saved This Month" },
    { value: 0,                  label: "Active En Route This Month" },
    { value: 0,                  label: "Pending Deliveries This Month" },
    {
      value: Math.round(
        recentTrips.reduce(
          (s, t) => s + (t.route?.distance_miles || t.routeData?.distanceMiles || 0),
          0
        )
      ),
      label: "Total Distance This Month",
    },
  ];

  const storedUser = (() => { try { return getCurrentUser() || {}; } catch { return {}; } })();
  const driverName = storedUser.name || storedUser.username || "Dummy Driver";

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleTripGenerated = (data) => {
    const saved = saveTrip(data);
    setActiveTrip(saved);
    setTripData(saved);
    setRecentTrips((prev) => [tripListItem(saved), ...prev.filter((t) => t.id !== saved.id)]);
    setView("trip-results");
  };

  const handleTripDetail = (trip) => {
    setActiveTrip(trip);
    setTripData(trip);
    setSelectedTrip(trip);
    setView("trip-detail");
  };

  const handleViewDailyLogs = () => setView("daily-logs");
  const handleLogout = () => { clearCurrentUser(); navigate("/login"); };

  // Close drawer and switch view
  const handleNav = (key) => {
    setView(key);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: "Dashboard",    icon: LayoutDashboard, key: "overview"     },
    { label: "Plan New Trip", icon: MapPinned,       key: "plan-trip"    },
    { label: "Trip Results",  icon: Route,           key: "trip-results" },
    { label: "My Trips",      icon: List,            key: "my-trips"     },
    { label: "Daily Logs",    icon: FileClock,       key: "daily-logs"   },
    { label: "Settings",      icon: Settings,        key: "settings"     },
  ];

  // Bottom nav shows 5 primary items (Settings goes into drawer)
  const bottomNavItems = [
    { label: "Home",     icon: LayoutDashboard, key: "overview"     },
    { label: "Plan",     icon: MapPinned,       key: "plan-trip"    },
    { label: "Results",  icon: Route,           key: "trip-results" },
    { label: "My Trips", icon: List,            key: "my-trips"     },
    { label: "Logs",     icon: FileClock,       key: "daily-logs"   },
    { label: "Settings", icon: Settings,        key: "settings"     },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F5F6FA] flex text-slate-800 font-sans overflow-hidden">

      {/* ════════════════════ MOBILE DRAWER ════════════════════ */}
      {/* Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-in panel */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-[#0B1E3F] text-white
          flex flex-col p-5 pt-6 shadow-2xl
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Mobile navigation drawer"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="https://i.pravatar.cc/150?img=12"
              alt={driverName}
              className="w-10 h-10 rounded-full border-2 border-white/20 object-cover"
            />
            <p className="text-sm font-bold text-white leading-tight">{driverName}</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <SidebarNav
          navItems={navItems}
          view={view}
          onNav={handleNav}
          onLogout={handleLogout}
        />
      </aside>

      {/* ════════════════════ DESKTOP SIDEBAR ════════════════════ */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[#0B1E3F] text-white p-5 pt-8 min-h-screen">
        <div className="flex flex-col items-center justify-center mb-8 pb-6 border-b border-white/10">
          <img
            src="https://i.pravatar.cc/150?img=12"
            alt={driverName}
            className="w-16 h-16 rounded-full object-cover border-2 border-white/20 mb-2 shadow-lg"
          />
          <p className="text-base font-bold text-white">{driverName}</p>
        </div>

        <SidebarNav
          navItems={navItems}
          view={view}
          onNav={setView}
          onLogout={handleLogout}
        />
      </aside>

      {/* ════════════════════ MAIN CONTENT ════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* ── Topbar ── */}
        <header className="flex items-center gap-3 px-4 sm:px-8 py-2.5 bg-white border-b border-slate-100 flex-shrink-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-[#0B1E3F] text-white shrink-0 hover:bg-[#0d2347] active:scale-95 transition-all"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={18} />
          </button>

          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full rounded-xl bg-[#F5F6FA] border border-transparent focus:border-blue-300 focus:outline-none pl-9 pr-4 py-2.5 text-sm placeholder:text-slate-400"
            />
          </div>

          <div className="flex justify-end items-center shrink-0">
            <img
              src={logo}
              alt="RouteLog Logo"
              width="160"
              height="64"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              className="h-12 sm:h-16 w-auto object-contain"
            />
          </div>
        </header>

        {/* ── Views (bottom-padded on mobile to clear bottom nav) ── */}
        <main className="flex-1 overflow-y-auto pb-[68px] lg:pb-0">

          {/* ─ Overview ─ */}
          {view === "overview" && (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Good morning, {driverName}!
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">Here's your overview for today.</p>
                </div>
                <button
                  onClick={() => setView("plan-trip")}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm shadow-blue-600/20 flex-shrink-0"
                >
                  <Plus size={16} /> Plan New Trip
                </button>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Cycle */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm min-w-0">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Current 8-Day Cycle</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <CycleGauge used={currentCycle} total={70} />
                    <div className="space-y-1.5">
                      <p className="text-xl font-bold text-emerald-500 leading-none">
                        {Math.max(0, 70 - currentCycle).toFixed(1)} hrs
                      </p>
                      <p className="text-xs text-slate-400">remaining</p>
                      <p className="text-sm font-semibold text-slate-700 pt-1">70 hrs total</p>
                      <p className="text-xs text-slate-400">8-day cycle</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
                    <Clock size={12} /> Cycle will reset in 3 days
                  </div>
                </div>

                {/* Driving today */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col min-w-0">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Driving Today</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Route size={22} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 leading-none">00:00</p>
                      <p className="text-xs text-slate-400 mt-1">hours</p>
                    </div>
                  </div>
                  <div className="mt-auto pt-4">
                    <p className="text-xs text-slate-400 mb-2">Out of 11 hrs limit</p>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-blue-600 w-0" />
                    </div>
                  </div>
                </div>

                {/* 14-hour window */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col min-w-0">
                  <p className="text-sm font-semibold text-slate-700 mb-3">14-Hour Window</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Clock size={22} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 leading-none">00:00</p>
                      <p className="text-xs text-slate-400 mt-1">hours used</p>
                    </div>
                  </div>
                  <div className="mt-auto pt-4">
                    <p className="text-xs text-slate-400 mb-2">14:00 hours available</p>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-blue-600 w-0" />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col min-w-0">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Current Status</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <ShieldCheck size={22} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900 leading-tight">HOS Compliant</p>
                      <p className="text-xs text-slate-400 mt-1">You are good to drive</p>
                    </div>
                  </div>
                  <div className="mt-auto pt-4">
                    <span className="inline-block text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                      All systems normal
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick actions + Recent Trips */}
              <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-5">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm min-w-0">
                  <p className="text-sm font-semibold text-slate-700 mb-4">Quick Actions</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { icon: Plus,      title: "Plan New Trip", sub: "Create a new trip plan", key: "plan-trip"    },
                      { icon: Truck,     title: "View My Trips", sub: "See all your trips",      key: "my-trips"     },
                      { icon: FileClock, title: "Daily Logs",    sub: "View your ELD logs",      key: "daily-logs"   },
                      { icon: List,      title: "Trip Results",  sub: "View latest route",       key: "trip-results" },
                    ].map(({ icon: Icon, title, sub, key }) => (
                      <button
                        key={key}
                        onClick={() => setView(key)}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 hover:bg-[#F5F6FA] transition-colors text-left min-w-0"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                          <Icon size={18} className="text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{title}</p>
                          <p className="text-xs text-slate-400 truncate">{sub}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-slate-700">Recent Trips</p>
                    <button
                      onClick={() => setView("my-trips")}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentTrips.slice(0, 3).map((trip, i) => (
                      <button
                        key={i}
                        onClick={() => handleTripDetail(trip)}
                        className="w-full flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0 min-w-0 hover:bg-slate-50 rounded-lg px-2 transition-colors text-left"
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            trip.status === "Planned" ? "bg-purple-500" : "bg-emerald-500"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {trip.from} <span className="text-slate-300 mx-1">→</span> {trip.to}
                          </p>
                          <p className="text-xs text-slate-400">{trip.date}</p>
                        </div>
                        <StatusPill status={trip.status} />
                      </button>
                    ))}
                    {recentTrips.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">
                        No trips yet. Plan your first trip!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-[#0B1E3F] p-6 sm:p-8 min-w-0">
                <div className="relative z-10 flex flex-wrap gap-8 sm:gap-14">
                  <div>
                    <p className="text-xs text-blue-100/60 mb-3 uppercase tracking-wide">Your Overview</p>
                    <div className="flex flex-wrap gap-8 sm:gap-14">
                      {overviewStats.map(({ value, label }) => {
                        const [main] = label.split(" This Month");
                        return (
                          <div key={label}>
                            <p className="text-2xl font-bold text-white">{value}</p>
                            <p className="text-xs text-blue-100/60 mt-1 max-w-[110px] leading-snug">
                              {main}<br />This Month
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=900&q=80"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width="900"
                  height="600"
                  className="hidden md:block absolute right-0 bottom-0 h-full w-[42%] object-cover object-left [mask-image:linear-gradient(to_right,transparent,black_18%)]"
                />
              </div>
            </div>
          )}

          {/* ─ Lazy views ─ */}
          <Suspense fallback={<Spinner />}>
            {view === "plan-trip" && (
              <PlanTrip onTripGenerated={handleTripGenerated} />
            )}

            {view === "trip-results" && (
              tripData
                ? <TripResults {...tripData} onViewDailyLogs={handleViewDailyLogs} />
                : <div className="p-10 text-center text-slate-400">
                    No trip data yet.{" "}
                    <button onClick={() => setView("plan-trip")} className="text-blue-600 underline">
                      Plan a trip first.
                    </button>
                  </div>
            )}

            {view === "my-trips" && (
              <MyTrips trips={recentTrips} onViewDetails={handleTripDetail} />
            )}

            {view === "trip-detail" && selectedTrip && (
              <TripDetail
                trip={selectedTrip}
                onBack={() => setView("my-trips")}
                onViewDailyLogs={() => setView("daily-logs")}
              />
            )}

            {view === "daily-logs" && (
              tripData
                ? <DailyLogs trip={tripData} onBack={() => setView("trip-results")} />
                : <div className="p-10 text-center text-slate-400">
                    No trip data yet.{" "}
                    <button onClick={() => setView("plan-trip")} className="text-blue-600 underline">
                      Plan a trip first.
                    </button>
                  </div>
            )}

            {view === "settings" && <SettingsComponent />}
          </Suspense>

        </main>
      </div>

      {/* ════════════════════ MOBILE BOTTOM NAV ════════════════════ */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200
          flex items-stretch shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
        aria-label="Bottom navigation"
        style={{ height: "68px" }}
      >
        {bottomNavItems.map(({ label, icon: Icon, key }) => {
          const active = view === key;
          return (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-current={active ? "page" : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 px-0.5 min-w-0
                transition-colors duration-150
                ${active ? "text-blue-600" : "text-slate-400 active:text-slate-600"}`}
            >
              {/* Active indicator dot */}
              <span
                className={`block h-0.5 w-5 rounded-full mb-1 transition-all duration-200 ${
                  active ? "bg-blue-600" : "bg-transparent"
                }`}
              />
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              <span className={`text-[10px] leading-none mt-0.5 ${active ? "font-semibold" : "font-medium"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}