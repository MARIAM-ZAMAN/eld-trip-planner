// src/components/DailyLogs.jsx
import { useState } from "react";
import { ArrowLeft, Download, Calendar, Printer, FileText } from "lucide-react";
import { formatMinutesToHrMin, minuteToHHMM } from '../utils/time';
import { getCurrentUser } from '../utils/storage';

export default function DailyLogs({ trip, onBack }) {
  const [selectedDay, setSelectedDay] = useState(1);
  const logs = trip?.daily_logs || [];
  const selectedLog = logs[selectedDay - 1];
  const totals = selectedLog?.totals || {};
  const formatHours = formatMinutesToHrMin;

  const user = (() => {
    try {
      return getCurrentUser() || {};
    } catch {
      return {};
    }
  })();
  const driverName = user.name || user.username || "John Driver";

  // Grid coordinates mapping
  // Row 1 (Off Duty) -> y=20
  // Row 2 (Sleeper Berth) -> y=70
  // Row 3 (Driving) -> y=120
  // Row 4 (On Duty Not Driving) -> y=170
  const rowForStatus = {
    OFF_DUTY: 20,
    SLEEPER_BERTH: 70,
    DRIVING: 120,
    ON_DUTY: 170,
    ON_DUTY_NOT_DRIVING: 170,
  };

  const statusLabel = {
    OFF_DUTY: 'Off Duty',
    SLEEPER_BERTH: 'Sleeper Berth',
    DRIVING: 'Driving',
    ON_DUTY: 'On Duty (Not Driving)',
    ON_DUTY_NOT_DRIVING: 'On Duty (Not Driving)',
  };

  const statusBadgeColor = {
    OFF_DUTY: 'bg-slate-100 text-slate-700',
    SLEEPER_BERTH: 'bg-emerald-50 text-emerald-700',
    DRIVING: 'bg-blue-50 text-blue-700',
    ON_DUTY: 'bg-amber-50 text-amber-700',
    ON_DUTY_NOT_DRIVING: 'bg-amber-50 text-amber-700',
  };

  // SVG dimensions: left label margin = 160, grid width = 680, right margin = 40 (total viewBox 880 x 210)
  const gridStart = 160;
  const gridWidth = 680;
  const chartX = (minute) => gridStart + (Math.max(0, Math.min(1440, minute)) / 1440) * gridWidth;

  const dutySegments = selectedLog?.segments || [];
  const chartPath = dutySegments.reduce((path, segment, index) => {
    const startX = chartX(segment.start_minute);
    const endX = chartX(segment.end_minute);
    const y = rowForStatus[segment.status] || 20;
    if (index === 0) return `M ${startX} ${y} L ${endX} ${y}`;
    const previous = dutySegments[index - 1];
    const previousY = rowForStatus[previous.status] || 20;
    return `${path} L ${startX} ${previousY} L ${startX} ${y} L ${endX} ${y}`;
  }, '');

  const handlePrint = () => {
    window.print();
  };

  const remarksList = (selectedLog?.remarks?.length ? selectedLog.remarks : selectedLog?.segments) || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Daily ELD logs</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review the duty status record created for each day of the trip.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 border border-slate-200 bg-white px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              <ArrowLeft size={16} /> Back to Schedule
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm shadow-blue-600/20 transition"
          >
            <Printer size={16} /> Print / Download Log
          </button>
        </div>
      </div>

      {/* 2. DAY SELECTOR */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm w-full sm:w-auto overflow-x-auto">
        <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium px-2 shrink-0">
          <Calendar size={16} /> Trip Day:
        </div>
        <div className="flex gap-2">
          {(logs.length ? logs : [{ day_number: 1 }]).map((log) => (
            <button
              key={log.day_number}
              onClick={() => setSelectedDay(log.day_number)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                selectedDay === log.day_number
                  ? 'bg-[#0B1E3F] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Day {log.day_number}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN LOG CARD */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
        
        {/* Log Card Header */}
        <div className="relative border-b border-slate-200 pb-4 flex flex-wrap items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">DRIVER'S DAILY LOG</h2>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5">Form M-101 / FMCSA 49 CFR Part 395 Compliant Record</p>
          </div>
          <div className="bg-[#0B1E3F] text-white px-4 py-1 rounded-full text-xs font-bold mt-2 sm:mt-0">
            Day {selectedDay} of {logs.length || 1}
          </div>
        </div>

        {/* Info Grid (Gray Box) */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-3 gap-6 text-[11px]">
          <div className="space-y-3">
            <div>
              <p className="text-slate-500 uppercase font-semibold tracking-wide">DATE:</p>
              <p className="font-medium text-slate-800">{selectedLog?.date || 'No trip selected'}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase font-semibold tracking-wide">FROM LOCATION:</p>
              <p className="font-medium text-slate-800">{selectedLog?.from || trip?.formData?.currentLocation || trip?.locations?.current?.label || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase font-semibold tracking-wide">TRUCK NUMBER:</p>
              <p className="font-medium text-slate-800">TRK-408</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-slate-500 uppercase font-semibold tracking-wide">DRIVER NAME:</p>
              <p className="font-medium text-slate-800">{driverName}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase font-semibold tracking-wide">TO LOCATION:</p>
              <p className="font-medium text-slate-800">{selectedLog?.to || trip?.formData?.dropoffLocation || trip?.locations?.dropoff?.label || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase font-semibold tracking-wide">TRAILER NUMBER:</p>
              <p className="font-medium text-slate-800">TRL-921</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-slate-500 uppercase font-semibold tracking-wide">CARRIER NAME:</p>
              <p className="font-medium text-slate-800">RouteLog Freight Systems LLC</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase font-semibold tracking-wide">TOTAL MILES DRIVING TODAY:</p>
              <p className="font-medium text-slate-800">{selectedLog?.total_miles_driving_today || 0} mi</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase font-semibold tracking-wide">SHIPPING DOC / BOL:</p>
              <p className="font-medium text-slate-800">BOL-2026-8841</p>
            </div>
          </div>
        </div>

        {/* Duty Status Grid (Chart) */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3">Record of Duty Status (24-Hour Grid)</h3>
          <div className="relative w-full overflow-x-auto border border-slate-200 rounded-lg p-3 bg-white">
             <svg viewBox="0 0 880 210" className="w-full h-auto min-w-[720px]">
                {/* Background duty lines */}
                <line x1={gridStart} y1="20" x2={gridStart + gridWidth} y2="20" stroke="#CBD5E1" strokeWidth="1" />
                <line x1={gridStart} y1="70" x2={gridStart + gridWidth} y2="70" stroke="#CBD5E1" strokeWidth="1" />
                <line x1={gridStart} y1="120" x2={gridStart + gridWidth} y2="120" stroke="#CBD5E1" strokeWidth="1" />
                <line x1={gridStart} y1="170" x2={gridStart + gridWidth} y2="170" stroke="#CBD5E1" strokeWidth="1" />

                {/* 24 Hour Vertical Grid Lines & Half-Hour Sub-Ticks */}
                {[...Array(25)].map((_, hour) => {
                  const x = gridStart + (hour / 24) * gridWidth;
                  return (
                    <g key={`hour-${hour}`}>
                      {/* Main Hour Vertical Line */}
                      <line x1={x} y1="20" x2={x} y2="170" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2" />
                      
                      {/* Half-Hour Tick Mark between hour lines */}
                      {hour < 24 && (
                        <line
                          x1={x + (1 / 48) * gridWidth}
                          y1="18"
                          x2={x + (1 / 48) * gridWidth}
                          y2="22"
                          stroke="#94A3B8"
                          strokeWidth="1"
                        />
                      )}
                      {hour < 24 && (
                        <line
                          x1={x + (1 / 48) * gridWidth}
                          y1="68"
                          x2={x + (1 / 48) * gridWidth}
                          y2="72"
                          stroke="#94A3B8"
                          strokeWidth="1"
                        />
                      )}
                      {hour < 24 && (
                        <line
                          x1={x + (1 / 48) * gridWidth}
                          y1="118"
                          x2={x + (1 / 48) * gridWidth}
                          y2="122"
                          stroke="#94A3B8"
                          strokeWidth="1"
                        />
                      )}
                      {hour < 24 && (
                        <line
                          x1={x + (1 / 48) * gridWidth}
                          y1="168"
                          x2={x + (1 / 48) * gridWidth}
                          y2="172"
                          stroke="#94A3B8"
                          strokeWidth="1"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Stepped Duty Status Path */}
                {chartPath && (
                  <path d={chartPath} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
                )}

                {/* Left Labels (Positioned safely to avoid cut-off) */}
                <text x="150" y="24" fontSize="11" fontWeight="600" fill="#334155" textAnchor="end">1. Off Duty</text>
                <text x="150" y="74" fontSize="11" fontWeight="600" fill="#334155" textAnchor="end">2. Sleeper Berth</text>
                <text x="150" y="124" fontSize="11" fontWeight="600" fill="#334155" textAnchor="end">3. Driving</text>
                <text x="150" y="174" fontSize="11" fontWeight="600" fill="#334155" textAnchor="end">4. On Duty (Not Driving)</text>

                {/* Hour Labels at the bottom */}
                {[
                  { h: 0, label: "Mid" },
                  { h: 2, label: "2" },
                  { h: 4, label: "4" },
                  { h: 6, label: "6" },
                  { h: 8, label: "8" },
                  { h: 10, label: "10" },
                  { h: 12, label: "Noon" },
                  { h: 14, label: "14" },
                  { h: 16, label: "16" },
                  { h: 18, label: "18" },
                  { h: 20, label: "20" },
                  { h: 22, label: "22" },
                  { h: 24, label: "Mid" }
                ].map(({ h, label }) => (
                  <text
                    key={`label-${h}`}
                    x={gridStart + (h / 24) * gridWidth}
                    y="194"
                    fontSize="10"
                    fontWeight="500"
                    fill="#64748B"
                    textAnchor="middle"
                  >
                    {label}
                  </text>
                ))}
             </svg>
          </div>
        </div>

        {/* Daily Duty Status Totals */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3">Daily Duty Status Totals</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "1. Off Duty", hours: formatHours(totals.off_duty_minutes), color: "bg-slate-800" },
              { label: "2. Sleeper Berth", hours: formatHours(totals.sleeper_berth_minutes), color: "bg-emerald-600" },
              { label: "3. Driving", hours: formatHours(totals.driving_minutes), color: "bg-blue-600" },
              { label: "4. On Duty (Not Driving)", hours: formatHours(totals.on_duty_minutes), color: "bg-amber-500" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                <div>
                  <p className="text-xs font-semibold text-slate-700">{item.label}</p>
                  <p className="text-[13px] font-bold text-slate-900">{item.hours}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Remarks & Location Records */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3">Remarks & Location Records</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="text-left py-2.5 px-4 font-semibold">Time</th>
                  <th className="text-left py-2.5 px-4 font-semibold">Location</th>
                  <th className="text-left py-2.5 px-4 font-semibold">Duty Status</th>
                  <th className="text-left py-2.5 px-4 font-semibold">Remarks / Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {remarksList.map((row, index) => {
                  const isRemark = 'time' in row;
                  const time     = isRemark ? row.time : minuteToHHMM(row.start_minute);
                  const location = row.location || selectedLog?.from || 'En Route';
                  const rawStatus = row.status || 'OFF_DUTY';
                  const displayStatus = statusLabel[rawStatus] || rawStatus.replaceAll('_', ' ');
                  const badgeCls = statusBadgeColor[rawStatus] || 'bg-slate-100 text-slate-700';
                  const remark   = isRemark
                    ? row.description
                    : (row.description || rawStatus.replaceAll('_', ' '));

                  return (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-800">{time}</td>
                      <td className="py-2.5 px-4 text-slate-700">{location}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeCls}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-medium">{remark}</td>
                    </tr>
                  );
                })}
                {remarksList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No remarks recorded for this day.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature Section */}
        <div className="flex flex-wrap items-end justify-between gap-6 pt-4 border-t border-slate-100">
          <div className="flex-1 min-w-[200px]">
            <div className="border-b-2 border-slate-800 pb-1 w-full mb-1">
              <span className="text-sm font-bold text-slate-800">{driverName}</span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Driver's Signature (Certified True & Correct)</p>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="border-b-2 border-slate-800 pb-1 w-full mb-1">
              <span className="text-sm font-bold text-slate-800">{selectedLog?.date || new Date().toISOString().split('T')[0]}</span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Date</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}