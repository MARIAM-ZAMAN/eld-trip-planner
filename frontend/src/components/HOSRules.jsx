// src/components/HOSRules.jsx
import { useRef, useEffect, useState } from 'react';
function HOSRules() {
  const rules = [
    {
      value: '11 Hours',
      label: 'Driving Limit',
      descLine1: 'Maximum driving time',
      descLine2: 'in a 14-hour window',
      color: '#2563eb', // blue
      bg: 'from-blue-50 to-blue-100/40',
      border: 'border-blue-500',
      icon: (
        <>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 4.5V8" />
          <path d="M6.3 17.5l2.9-2" />
          <path d="M17.7 17.5l-2.9-2" />
        </>
      ),
    },
    {
      value: '14 Hours',
      label: 'Driving Window',
      descLine1: 'Total on-duty window',
      descLine2: 'before driving must stop',
      color: '#16a34a', // green
      bg: 'from-green-50 to-green-100/40',
      border: 'border-green-500',
      icon: (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </>
      ),
    },
    {
      value: '30 Minutes',
      label: 'Required Break',
      descLine1: 'After 8 cumulative hours',
      descLine2: 'of driving',
      color: '#d97706', // amber
      bg: 'from-amber-50 to-amber-100/40',
      border: 'border-amber-500',
      icon: (
        <>
          <path d="M6 9h11a3 3 0 0 1 0 6h-1" />
          <path d="M6 9v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V9" />
          <path d="M8 4v2" />
          <path d="M11 3v2" />
        </>
      ),
    },
    {
      value: '70 / 8',
      label: 'Cycle Limit',
      descLine1: 'Maximum 70 on-duty hours',
      descLine2: 'in 8 consecutive days',
      color: '#9333ea', // purple
      bg: 'from-purple-50 to-purple-100/40',
      border: 'border-purple-500',
      icon: (
        <>
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M4 10h16" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
        </>
      ),
    },
  ];

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

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .hos-fade-up { opacity: 0; }
        .hos-fade-up.active { animation: fadeUp 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) forwards; }

        @keyframes fadeDown {
          0% { opacity: 0; transform: translateY(-30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .hos-fade-down { opacity: 0; }
        .hos-fade-down.active { animation: fadeDown 0.6s cubic-bezier(0.2, 0.9, 0.3, 1) forwards; }
      `}</style>

      <section
        ref={sectionRef}
        className="relative w-full py-16 lg:py-24 overflow-hidden bg-gradient-to-b from-blue-100/60 via-indigo-100/40 to-white"
      >
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10">

          {/* Header */}
          <div className={`text-center max-w-2xl mx-auto mb-12 lg:mb-16 hos-fade-down ${isVisible ? 'active' : ''}`}>
            <span className="inline-block text-[#487bf2] font-bold text-xs sm:text-sm tracking-[0.08em] uppercase mb-2">
              Hours of Service
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[33px] font-extrabold text-[#0f1b3d] leading-[1.15] mb-3">
              BUILT AROUND YOUR DRIVING LIMITS
            </h2>
            <p className="text-[#4b5570] text-sm sm:text-base">
              Our planner follows key HOS rules to keep you compliant.
            </p>
          </div>

          {/* Rules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6">
            {rules.map((rule, index) => (
              <div
                key={rule.label}
                className={`relative bg-gradient-to-br ${rule.bg} rounded-2xl p-6 text-center border-t-4 ${rule.border} shadow-sm hover:shadow-lg transition-shadow duration-300 hos-fade-up ${isVisible ? 'active' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={rule.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {rule.icon}
                  </svg>
                </div>

                {/* Value */}
                <h3 className="text-2xl font-extrabold mb-1" style={{ color: rule.color }}>
                  {rule.value}
                </h3>

                {/* Label */}
                <p className="text-[#0f1b3d] font-semibold text-sm mb-3">{rule.label}</p>

                {/* Description */}
                <p className="text-[#4b5570] text-xs leading-relaxed">
                  {rule.descLine1}
                  <br />
                  <span className="font-semibold text-[#0f1b3d]">{rule.descLine2}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default HOSRules;
