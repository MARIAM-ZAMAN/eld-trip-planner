// src/components/HOSSchedule.jsx
import { CheckCircle, AlertCircle } from "lucide-react";
import { formatHoursHM } from '../utils/time';

// ── colour palette ──────────────────────────────────────────────────────────
const EVENT_COLORS = {
  DRIVING:       { bar: '#2563EB', text: 'text-blue-700',   bg: 'bg-blue-50',    label: 'Driving' },
  BREAK:         { bar: '#9333EA', text: 'text-purple-700', bg: 'bg-purple-50',  label: 'Break' },
  FUEL:          { bar: '#9333EA', text: 'text-purple-700', bg: 'bg-purple-50',  label: 'Fuel' },
  PICKUP:        { bar: '#f97316', text: 'text-orange-700', bg: 'bg-orange-50',  label: 'Pickup' },
  DROPOFF:       { bar: '#f97316', text: 'text-orange-700', bg: 'bg-orange-50',  label: 'Drop-off' },
  DAILY_REST:    { bar: '#16a34a', text: 'text-green-700',  bg: 'bg-green-50',   label: '10-h Rest' },
  CYCLE_RESTART: { bar: '#0891b2', text: 'text-cyan-700',   bg: 'bg-cyan-50',    label: '34-h Restart' },
  TRIP_END:      { bar: '#94a3b8', text: 'text-slate-500',  bg: 'bg-slate-50',   label: 'Trip End' },
};

const MINUTES_PER_DAY = 1440;

/**
 * Slice events into per-day buckets.
 * Each bucket is an array of { type, duty_status, start_min, end_min, duration_min }
 * where start_min/end_min are LOCAL to the day (0–1440).
 */
function buildDayBuckets(events = []) {
  const buckets = {};

  for (const ev of events) {
    if (!ev || ev.duration_minutes == null) continue;
    const evStart = ev.start_minute;
    const evEnd   = ev.end_minute;

    // An event can span multiple days – slice it into each day it touches
    const firstDay = Math.floor(evStart / MINUTES_PER_DAY);
    const lastDay  = Math.floor(Math.max(evEnd - 1, evStart) / MINUTES_PER_DAY);

    for (let d = firstDay; d <= lastDay; d++) {
      const dayStart = d * MINUTES_PER_DAY;
      const dayEnd   = dayStart + MINUTES_PER_DAY;

      const segStart = Math.max(evStart, dayStart) - dayStart;
      const segEnd   = Math.min(evEnd,   dayEnd)   - dayStart;
      if (segEnd <= segStart) continue;

      if (!buckets[d]) buckets[d] = [];
      buckets[d].push({
        type:         ev.type,
        duty_status:  ev.duty_status,
        start_min:    segStart,
        end_min:      segEnd,
        duration_min: segEnd - segStart,
        description:  ev.description || ev.label || ev.type,
      });
    }
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => +a - +b)
    .map(([day, segs]) => ({ day: +day + 1, segments: segs }));
}

// ── 24-hour grid for one day ─────────────────────────────────────────────────
function DayGrid({ day, segments }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Day {day}</p>

      {/* Hour tick marks */}
      <div className="relative h-8 mb-1">
        {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].map(h => (
          <span
            key={h}
            className="absolute text-[9px] text-slate-400 -translate-x-1/2"
            style={{ left: `${(h / 24) * 100}%`, top: 0 }}
          >
            {h === 0 ? 'Mid' : h === 12 ? 'Noon' : h === 24 ? 'Mid' : h}
          </span>
        ))}
        {/* Vertical grid lines */}
        {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].map(h => (
          <div
            key={`v${h}`}
            className="absolute top-4 bottom-0 border-l border-slate-100"
            style={{ left: `${(h / 24) * 100}%` }}
          />
        ))}
      </div>

      {/* The bar track */}
      <div className="relative h-6 bg-slate-100 rounded-lg overflow-hidden">
        {segments.map((seg, i) => {
          const color = EVENT_COLORS[seg.type]?.bar || '#94a3b8';
          const left  = (seg.start_min / MINUTES_PER_DAY) * 100;
          const width = (seg.duration_min / MINUTES_PER_DAY) * 100;
          return (
            <div
              key={i}
              className="absolute top-0 h-full flex items-center justify-center"
              style={{ left: `${left}%`, width: `${Math.max(width, 0.3)}%`, backgroundColor: color }}
              title={`${seg.description} (${(seg.duration_min / 60).toFixed(1)} h)`}
            >
              {width > 6 && (
                <span className="text-white text-[9px] font-semibold truncate px-0.5">
                  {(seg.duration_min / 60).toFixed(1)}h
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend for this day */}
      <div className="flex flex-wrap gap-2 mt-2">
        {[...new Set(segments.map(s => s.type))].map(type => {
          const c = EVENT_COLORS[type];
          if (!c) return null;
          const mins = segments.filter(s => s.type === type).reduce((a, s) => a + s.duration_min, 0);
          return (
            <span key={type} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
              {c.label}: {(mins / 60).toFixed(1)}h
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function HOSSchedule({
  events    = [],
  stops     = [],
  cycleUsed = 0,
  totalCycle = 70,
  summary   = {},
  cycle     = {},
}) {
  const remaining     = +(cycle.remaining_cycle_hours ?? Math.max(0, totalCycle - cycleUsed));
  const drivingHours  = (summary.driving_minutes || 0) / 60;
  const totalTripHours = (summary.total_trip_minutes || summary.trip_duration_minutes || 0) / 60;

  // Build per-day event buckets for the schedule overview
  const dayBuckets = buildDayBuckets(events);

  // Aggregate stop counts
  const breakCount   = stops.filter(s => s.type === 'BREAK').length;
  const restCount    = stops.filter(s => s.type === 'DAILY_REST').length;
  const restartCount = stops.filter(s => s.type === 'CYCLE_RESTART').length;
  const fuelCount    = stops.filter(s => s.type === 'FUEL').length;
  const restartRequired = !!cycle.restart_required;

  // 11-h limit: driving since last rest, not total trip driving
  // Use summary.driving_minutes capped at 11h for the first window
  const driving11hUsed = Math.min(drivingHours, 11);

  return (
    <div className="space-y-8">

      {/* 1. SCHEDULE OVERVIEW - per-day 24h grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Driving & Rest Schedule Overview</h3>
        <p className="text-xs text-slate-400 mb-4">
          {dayBuckets.length} day{dayBuckets.length !== 1 ? 's' : ''} · Each bar represents a 24-hour period
        </p>

        {dayBuckets.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
            No schedule data. Generate a trip first.
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl border border-slate-100">
            {dayBuckets.map(({ day, segments }) => (
              <DayGrid key={day} day={day} segments={segments} />
            ))}
          </div>
        )}

        {/* Colour legend */}
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(EVENT_COLORS).filter(([t]) => t !== 'TRIP_END').map(([type, c]) => (
            <span key={type} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* 2. HOS LIMITS */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-4">HOS Limits (First Duty Window)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* 11-Hour Driving */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-700 mb-2">11-Hour Driving Limit</p>
            <div className="relative h-4 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                   style={{ width: `${Math.min(100, (driving11hUsed / 11) * 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] font-semibold mt-1 text-slate-600">
              <span>Used {formatHoursHM(driving11hUsed)}</span>
              <span className="text-slate-400">Remaining <span className="text-slate-800">{formatHoursHM(Math.max(0, 11 - driving11hUsed))}</span></span>
            </div>
          </div>

          {/* 70-Hour Cycle */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-700 mb-2">70-Hour / 8-Day Cycle</p>
            <div className="relative h-4 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-orange-400 rounded-full"
                   style={{ width: `${Math.min(100, (cycleUsed / totalCycle) * 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] font-semibold mt-1 text-slate-600">
              <span>Used {formatHoursHM(cycleUsed)}</span>
              <span className="text-slate-400">Remaining <span className="text-slate-800">{formatHoursHM(remaining)}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. REQUIREMENTS CHECKLIST */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-4">HOS Requirements Status</h3>
        <div className="space-y-2">
          {[
            {
              label:  '30-Minute Break',
              desc:   breakCount > 0 ? `${breakCount} break${breakCount > 1 ? 's' : ''} scheduled` : 'No break required (pickup/fuel satisfied rule)',
              ok:     true,
              status: breakCount > 0 ? `${breakCount} Scheduled` : 'Satisfied',
            },
            {
              label:  'Fuel Stops',
              desc:   fuelCount > 0 ? `${fuelCount} fuel stop${fuelCount > 1 ? 's' : ''} planned` : 'Route under 900 miles',
              ok:     true,
              status: fuelCount > 0 ? `${fuelCount} Planned` : 'Not Required',
            },
            {
              label:  '10-Hour Rest',
              desc:   restCount > 0 ? `${restCount} rest period${restCount > 1 ? 's' : ''} scheduled` : 'Trip within 11-hour window',
              ok:     true,
              status: restCount > 0 ? `${restCount} Scheduled` : 'Not Required',
            },
            {
              label:  '70-Hour Cycle',
              desc:   restartRequired
                ? `${restartCount} cycle restart${restartCount > 1 ? 's' : ''} planned — ${remaining.toFixed(1)} hrs remaining after`
                : `${remaining.toFixed(1)} hrs remaining`,
              ok:     true,
              status: restartRequired ? `${restartCount} Restart${restartCount > 1 ? 's' : ''} Planned` : 'Within Limit',
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                {item.ok
                  ? <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                  : <AlertCircle size={18} className="text-amber-500 shrink-0" />}
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${item.ok ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. EVENT BREAKDOWN TABLE */}
      {events.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-4">Full Event Schedule</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="text-left py-2 px-4 font-semibold">#</th>
                  <th className="text-left py-2 px-4 font-semibold">Type</th>
                  <th className="text-left py-2 px-4 font-semibold">Duration</th>
                  <th className="text-left py-2 px-4 font-semibold hidden sm:table-cell">Location</th>
                  <th className="text-left py-2 px-4 font-semibold hidden md:table-cell">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {events
                  .filter(ev => ev.type !== 'TRIP_END')
                  .map((ev, i) => {
                    const c = EVENT_COLORS[ev.type];
                    return (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-4 text-slate-400">{i + 1}</td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c?.bg || 'bg-slate-100'} ${c?.text || 'text-slate-700'}`}>
                            {c?.label || ev.type}
                          </span>
                        </td>
                        <td className="py-2 px-4 font-medium text-slate-800">
                          {formatHoursHM(ev.duration_minutes / 60)}
                        </td>
                        <td className="py-2 px-4 text-slate-600 hidden sm:table-cell">
                          {ev.location || '—'}
                        </td>
                        <td className="py-2 px-4 text-slate-500 hidden md:table-cell">
                          {ev.description || '—'}
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}