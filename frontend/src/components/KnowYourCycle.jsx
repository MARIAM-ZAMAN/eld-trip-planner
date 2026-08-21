
function CycleSection() {
  return (
    <section className="w-full bg-white py-16 lg:py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        
        {/* 3-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 items-start">
          
          {/* ---- LEFT COLUMN: Text Content ---- */}
          <div className="flex flex-col">
            <span className="text-[#0d7df2] font-bold uppercase text-sm tracking-wide mb-1">
              Know Your Cycle
            </span>
            <h2 className="text-[#0f1b3d] text-3xl lg:text-3xl font-extrabold leading-tight">
              UNDERSTAND YOUR <br /> 8-DAY CYCLE
            </h2>
            <p className="text-[#4b5570] text-sm lg:text-[15px] leading-relaxed mt-3">
              Enter the on-duty hours already used in your current 8-day cycle. The planner will use your remaining cycle hours when building your trip schedule.
            </p>

            {/* Example Calculation Box */}
            <div className="relative bg-[#f4f8fe] rounded-xl p-4 pr-6 mt-6 flex items-center justify-between max-w-xs w-full border border-blue-100/50">
              {/* Left Section */}
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-[#4b5570] uppercase tracking-wider">Example</span>
                <span className="text-[11px] text-[#4b5570]">Current Cycle Used</span>
                <span className="text-[#0d7df2] text-xl font-bold">32 hrs</span>
              </div>

              {/* Arrow */}
              <div className="text-[#0d7df2]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>

              {/* Right Section */}
              <div className="flex flex-col">
                <span className="text-[11px] text-[#4b5570]">Cycle Remaining</span>
                <span className="text-[#1c8041] text-xl font-bold">38 hrs</span>
              </div>

              {/* Bottom Left Cyan Curve */}
              <div className="absolute -bottom-[2px] left-0 w-8 h-4 border-b-4 border-l-4 border-[#38bdf8] rounded-bl-xl pointer-events-none" />
            </div>
          </div>

          {/* ---- CENTER COLUMN: Donut Chart ---- */}
          <div className="flex flex-col items-center justify-center">
            {/* Donut Chart */}
            <div className="relative w-44 h-44 lg:w-52 lg:h-52 mx-auto">
              <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                {/* Base light grey circle */}
                <circle cx="50" cy="50" r="40" stroke="#f0f4f9" strokeWidth="8" fill="none" />
                
                {/* 38 hrs remaining (Light Blue) - 54.2% */}
                <circle cx="50" cy="50" r="40" stroke="#b7d6f8" strokeWidth="8" fill="none" strokeDasharray="136.4 251.32" />
                
                {/* 32 hrs used (Dark Blue) - 45.7% */}
                <circle cx="50" cy="50" r="40" stroke="#0d7df2" strokeWidth="8" fill="none" strokeDasharray="114.9 251.32" strokeDashoffset="136.4" />
              </svg>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[#0f1b3d] text-4xl lg:text-5xl font-bold">70</span>
                <span className="text-[#4b5570] text-xs lg:text-sm">Total Hours</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#0d7df2]"></div>
                <span className="text-[#0d7df2] text-sm font-medium">32 hrs used</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#aeccec]"></div>
                <span className="text-[#aeccec] text-sm font-medium">38 hrs remaining</span>
              </div>
            </div>
          </div>

          {/* ---- RIGHT COLUMN: Tip Box & Truck ---- */}
          <div className="relative bg-[#f6f9fe] rounded-xl p-6 lg:p-8 min-h-[220px] lg:min-h-[260px] flex flex-col border border-blue-50">
            {/* Top Icon & Title */}
            <div className="flex items-center gap-2 mb-2">
              {/* ✅ CHANGE: 'R' ko hata kar Human (User) icon daal diya hai */}
              <div className="w-7 h-7 rounded-full border-[1.5px] border-[#0d7df2] flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0d7df2]">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="text-[#0f1b3d] font-bold text-base">New driver?</span>
            </div>
            
            {/* Description */}
            <p className="text-[#4b5570] text-sm leading-relaxed max-w-[200px] lg:max-w-[220px] relative z-10">
              If you haven't used any hours in your current cycle, simply enter 0.
            </p>

            {/* Truck Illustration (Semi-Truck SVG exactly like the reference) */}
            <div className="absolute bottom-0 right-0 w-[160px] lg:w-[220px] h-auto pointer-events-none opacity-80">
              <svg viewBox="0 0 220 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto text-[#8a99ae]">
                {/* Trailer shadow/baseline */}
                <path d="M180 90 L40 90" stroke="#dbe4f0" strokeWidth="2" strokeLinecap="round" />
                
                {/* Trailer Body */}
                <path d="M50 40 L50 90 L180 90 L180 40 Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M50 50 L180 50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.5" />
                <path d="M50 70 L180 70" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.5" />
                
                {/* Trailer inner lines */}
                <path d="M70 40 L70 90" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                <path d="M160 40 L160 90" stroke="currentColor" strokeWidth="1" opacity="0.4" />

                {/* Cab body */}
                <path d="M20 55 L50 55 L50 80 L15 80 L15 65 L20 55 Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M20 65 L15 65" stroke="currentColor" strokeWidth="1.5" />
                <path d="M20 80 L20 90 L45 90 L45 80" stroke="currentColor" strokeWidth="1.5" />
                
                {/* Cab Window */}
                <path d="M23 58 L45 58 L45 75 L23 75 Z" stroke="currentColor" strokeWidth="1" />
                <path d="M28 60 L35 60 L35 73 L28 73 Z" fill="currentColor" fillOpacity="0.15" />
                
                {/* Front Engine/Bumper */}
                <path d="M15 60 L10 60 L10 75 L15 75" stroke="currentColor" strokeWidth="1" />
                <path d="M10 75 L10 85 L15 85" stroke="currentColor" strokeWidth="1" />

                {/* Rear Wheels (Trailer) */}
                <circle cx="150" cy="90" r="14" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="150" cy="90" r="10" stroke="currentColor" strokeWidth="1" />
                <circle cx="150" cy="90" r="4" stroke="currentColor" strokeWidth="1" />
                
                <circle cx="130" cy="90" r="14" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="130" cy="90" r="10" stroke="currentColor" strokeWidth="1" />
                <circle cx="130" cy="90" r="4" stroke="currentColor" strokeWidth="1" />

                {/* Front Wheels (Cab) */}
                <circle cx="40" cy="90" r="12" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="40" cy="90" r="8" stroke="currentColor" strokeWidth="1" />
                <circle cx="40" cy="90" r="3" stroke="currentColor" strokeWidth="1" />
                
                {/* Fender details */}
                <path d="M25 80 Q35 95 50 80" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

export default CycleSection;