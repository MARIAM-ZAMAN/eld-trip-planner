// src/components/RouteSection.jsx
import { useRef, useEffect, useState } from 'react';

import routeMapImage from '../assets/route-map.webp'; 

function RouteSection() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

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

  // ✅ UPDATED: colorHex add kar diya hai taake icon color aur left line ka color 1 hi ho
  const stops = [
    {
      title: 'Fuel Stops',
      desc: 'Plan fueling at least every 1,000 miles',
      bg: 'bg-[#eff6ff]',
      colorHex: '#0d7df2', // Blue
      icon: (
        <path d="M4 4v16h12V4H4z" />
      ),
    },
    {
      title: 'Rest Stops',
      desc: 'Schedule required rest and 30-min breaks',
      bg: 'bg-[#f3e8ff]',
      colorHex: '#9333ea', // Purple
      icon: (
        <path d="M4 12h16v6H4v-6z" />
      ),
    },
    {
      title: 'Pickup',
      desc: '1 hour of on-duty time for pickup',
      bg: 'bg-[#fffbeb]',
      colorHex: '#d97706', // Orange
      icon: (
        <path d="M12 2l-8 4 8 4 8-4-8-4zM2 10l10 5 10-5M2 14l10 5 10-5" />
      ),
    },
    {
      title: 'Dropoff',
      desc: '1 hour of on-duty time for dropoff',
      bg: 'bg-[#fef2f2]',
      colorHex: '#ef4444', // Red
      icon: (
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      ),
    },
    {
      title: 'Route Instructions',
      desc: 'Step-by-step directions for your trip',
      bg: 'bg-[#f0fdf4]',
      colorHex: '#22c55e', // Green
      icon: (
        <path d="M12 2v20M4.93 4.93l2.83 2.83M17.07 4.93l-2.83 2.83M2 12h20M4.93 19.07l2.83-2.83M17.07 19.07l-2.83-2.83" />
      ),
    },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .route-fade-up { opacity: 0; }
        .route-fade-up.active { animation: fadeUp 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) forwards; }

        @keyframes fadeDown {
          0% { opacity: 0; transform: translateY(-30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .route-fade-down { opacity: 0; }
        .route-fade-down.active { animation: fadeDown 0.6s cubic-bezier(0.2, 0.9, 0.3, 1) forwards; }
      `}</style>

      <section
        ref={sectionRef}
        className="relative w-full py-16 lg:py-24 overflow-hidden bg-gradient-to-b from-blue-100/60 via-indigo-100/40 to-white"
      >
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10">

          {/* Header */}
          <div className={`text-center max-w-2xl mx-auto mb-12 lg:mb-16 route-fade-down ${isVisible ? 'active' : ''}`}>
            <span className="inline-block text-[#487bf2] font-bold text-xs sm:text-sm tracking-[0.08em] uppercase mb-2">
              Smart Route &amp; Stops
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-[#0f1b3d] leading-[1.15] mb-3">
              More Than Just a Route
            </h2>
            <p className="text-[#4b5570] text-sm sm:text-base">
              We plan your trip with the stops you need.
            </p>
          </div>

          {/* Main Content - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* -------- LEFT COLUMN (Map) -------- */}
            {/* ✅ UPDATED: max-w-lg add kar diya taake image thori bari aur prominent ho, center mein rahe */}
            <div className={`bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden self-center w-full max-w-md lg:max-w-lg mx-auto route-fade-up ${isVisible ? 'active' : ''}`} style={{ animationDelay: '0.1s' }}>
              <img 
                src={routeMapImage} 
                alt="Smart Route Map" 
                width="1200"
                height="519"
                loading="lazy"
                decoding="async"
                className="w-full h-auto block" 
                style={{ aspectRatio: '1200 / 519' }}
                onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML = '<div className="p-8 text-center text-[#4b5570] text-sm font-medium">Route Map Image Here</div>'; }}
              />
            </div>

            {/* -------- RIGHT COLUMN (Stop Details) -------- */}
            <div className="flex flex-col justify-center space-y-3">
              {stops.map((stop, index) => (
                <div 
                  key={stop.title} 
                  /* ✅ UPDATED: Left par colored line (border-l-[4px]) laga di hai, aur right/up/down border rakhi hai */
                  className={`flex items-center gap-4 p-3 sm:p-4 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm border-y border-r border-gray-100/60 border-l-[4px] route-fade-up ${isVisible ? 'active' : ''}`}
                  style={{ animationDelay: `${index * 0.08 + 0.2}s`, borderLeftColor: stop.colorHex }}
                >
                  {/* Icon Square - ab color is inline style se le raha hai taake perfect ho */}
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stop.bg} flex items-center justify-center shrink-0`} style={{ color: stop.colorHex }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {stop.icon}
                    </svg>
                  </div>
                  {/* Text */}
                  <div>
                    <h4 className="text-[#0f1b3d] font-bold text-sm sm:text-base leading-tight">{stop.title}</h4>
                    <p className="text-[#4b5570] text-xs sm:text-sm leading-relaxed mt-0.5">{stop.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default RouteSection;