import { useRef, useEffect, useState } from 'react';
import eldGraph from '../assets/eld-graph.webp';

function Logs() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeDay, setActiveDay] = useState(1); // Day 1 default active
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const days = [1, 2, 3];

  const logStats = [
    { label: 'Off Duty', value: '10.00' },
    { label: 'Sleeper Berth', value: '7.50' },
    { label: 'Driving', value: '5.50' },
    { label: 'On Duty (Not Driving)', value: '1.00' },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .log-fade-up { opacity: 0; }
        .log-fade-up.active { animation: fadeUp 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) forwards; }

        @keyframes fadeDown {
          0% { opacity: 0; transform: translateY(-30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .log-fade-down { opacity: 0; }
        .log-fade-down.active { animation: fadeDown 0.6s cubic-bezier(0.2, 0.9, 0.3, 1) forwards; }
      `}</style>

      <section ref={sectionRef} className="w-full bg-white py-16 lg:py-24 overflow-hidden">
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10">

          {/* Header */}
          <div className={`text-center max-w-3xl mx-auto log-fade-down ${isVisible ? 'active' : ''}`}>
            <span className="inline-block text-[#487bf2] font-bold text-xs sm:text-sm tracking-[0.08em] uppercase mb-2">
              Your Trip, Turned into Daily Logs
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[33px] font-extrabold text-[#0f1b3d] leading-[1.15] mb-3">
              AUTOMATICALLY GENERATED ELD LOGS 
            </h2>
            {/* UPDATED: Gap badha kar 'mb-14' kar diya hai taake aage space clear ho */}
            <p className="text-[#4b5570] text-sm sm:text-base mb-16">
              Every trip becomes accurate daily logs with the 24-hour duty status graph.
            </p>
          </div>

          {/* UPDATED: Main Grid Container ka top margin 'mt-10' kar diya hai */}
          <div className="flex flex-wrap items-start gap-8 lg:gap-12 mt-10">
            
            {/* -------- LEFT: Buttons + Graph -------- */}
            <div
              className={`flex flex-col gap-4 flex-1 min-w-[320px] log-fade-up ${isVisible ? 'active' : ''}`}
              style={{ animationDelay: '0.1s' }}
            >
              {/* Day Buttons - 'Day 1' ab hamesha blue dikhega */}
              <div className="flex flex-row gap-3 relative z-10">
                {days.map((day) => (
                  <button
                    key={`day-btn-${day}`}
                    type="button"
                    onClick={() => {
                      setActiveDay(day);
                      setImgError(false); // ✅ FIX: Error yahan solve kar diya gaya!
                    }}
                    className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      activeDay === day
                        ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                        : 'bg-white text-[#0f1b3d] border border-gray-200 shadow-sm hover:bg-gray-50'
                    }`}
                  >
                    Day {day}
                  </button>
                ))}
              </div>

              {/* Outer light box */}
              <div className="bg-[#f6f9fe] rounded-xl p-3 sm:p-4 w-full">
                {/* Inner WHITE box holding the actual graph data */}
                <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                  {!imgError ? (
                    <img
                      src={eldGraph}
                      alt={`ELD Duty Status Graph - Day ${activeDay}`}
                      width="570"
                      height="143"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto block object-contain"
                      style={{ aspectRatio: '570 / 143' }}
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="p-10 text-center text-[#4b5570] text-sm font-medium bg-white">
                      ELD Graph Image Here
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* -------- RIGHT: Total Hours box -------- */}
            <div
              className={`flex flex-col w-full max-w-sm lg:max-w-xs flex-shrink-0 log-fade-up ${isVisible ? 'active' : ''}`}
              style={{ animationDelay: '0.2s' }}
            >
              {/* UPDATED: 'bg-white' kar diya hai taake yeh white box ban jaye */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                <h3 className="text-[#0f1b3d] font-bold text-lg mb-1">Total Hours</h3>

                <div className="mt-4 space-y-1">
                  {logStats.map((stat, index) => (
                    <div key={index} className="flex justify-between items-center py-2.5 border-b border-gray-100">
                      <span className="text-[#4b5570] text-[14px] font-medium">{stat.label}</span>
                      <span className="text-[#0f1b3d] font-bold text-[14px]">{stat.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 mt-1 border-t-[2px] border-[#0f1b3d]">
                  <span className="text-[#0f1b3d] font-extrabold text-sm uppercase tracking-wider">TOTAL</span>
                  <span className="text-[#0f1b3d] font-extrabold text-base">24.00</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}

export default Logs;