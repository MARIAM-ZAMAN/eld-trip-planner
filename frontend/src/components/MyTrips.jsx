// src/components/MyTrips.jsx
import { useState } from "react";
import { Clock, Search, Filter, ArrowRight } from "lucide-react";

export default function MyTrips({ trips, onViewDetails }) { // 👈 Prop name update
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTrips = trips.filter((trip) => {
    const matchesTab = activeTab === "All" || trip.status === activeTab;
    const matchesSearch = trip.from.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          trip.to.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Trips</h1>

      {/* Tabs Filter */}
      <div className="flex items-center gap-6 border-b border-slate-200">
        {["All", "Planned", "In Progress", "Completed"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-800"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search trips..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
        <button className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-700 transition-colors"><Filter size={18} /></button>
      </div>

      {/* Trip Cards */}
      <div className="space-y-4">
        {filteredTrips.length === 0 ? (
          <p className="text-center text-slate-400 py-10">No trips found.</p>
        ) : (
          filteredTrips.map((trip, index) => {
            let badgeColor = "bg-slate-100 text-slate-700";
            if (trip.status === "Planned") badgeColor = "bg-purple-50 text-purple-600";
            else if (trip.status === "In Progress") badgeColor = "bg-blue-50 text-blue-600";
            else if (trip.status === "Completed") badgeColor = "bg-emerald-50 text-emerald-600";

            return (
              <button key={index} onClick={() => onViewDetails(trip)} className="w-full bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 text-left group">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <p className="text-base font-semibold text-slate-800">
                    {trip.from}, <span className="text-slate-400 font-normal">TX</span> 
                    <span className="text-slate-300 mx-2">→</span> 
                    {trip.to}, <span className="text-slate-400 font-normal">GA</span>
                  </p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>{trip.status}</span>
                </div>
                <p className="text-sm text-slate-400 mb-4">{trip.date}</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium"><Clock size={14} /> {trip.duration || "2 Days"}</div>
                  <div className="flex items-center gap-1 text-sm text-blue-600 font-medium group-hover:underline">View Trip <ArrowRight size={16} /></div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}