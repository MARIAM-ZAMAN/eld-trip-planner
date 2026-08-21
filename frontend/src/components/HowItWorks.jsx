// src/components/HowItWorks.jsx
import { useRef, useEffect, useState } from 'react';

function HowItWorks() {
  const steps = [
    {
      id: '01',
      title: 'Enter Your Trip',
      desc: 'Add your current location, pickup, dropoff, and current cycle hours.',
      icon: (
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      ),
    },
    {
      id: '02',
      title: 'Generate Your Plan',
      desc: 'We calculate your route, driving schedule, stops, and rest periods based on HOS rules.',
      icon: (
        <>
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M4.93 4.93l2.83 2.83" />
          <path d="M16.24 16.24l2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="M4.93 19.07l2.83-2.83" />
          <path d="M16.24 7.76l2.83-2.83" />
        </>
      ),
    },
    {
      id: '03',
      title: 'Get Your Daily Logs',
      desc: 'Automatically generate daily ELD logs with the 24-hour duty status graph.',
      icon: (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </>
      ),
    },
  ];

  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

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

  // Heading pehle slide-down hoti hai, uske baad boxes/arrows fade in hote hain
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 600); // heading animation ka duration
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .scroll-fade-up { opacity: 0; }
        .scroll-fade-up.active { animation: fadeUp 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) forwards; }

        /* Heading upper se neechay slide + fade hote hue aati hai */
        @keyframes fadeDown {
          0% { opacity: 0; transform: translateY(-30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .scroll-fade-down { opacity: 0; }
        .scroll-fade-down.active { animation: fadeDown 0.6s cubic-bezier(0.2, 0.9, 0.3, 1) forwards; }

        /* Boxes ke andar slow bluish pulse glow */
        @keyframes gentlePulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.05); }
        }
        .box-glow-pulse {
          animation: gentlePulse 6s ease-in-out infinite;
        }

        /* Continuous Arrow Bounce Effect */
        @keyframes bounceArrow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(6px); }
        }
        .bounce-arrow {
          animation: bounceArrow 1.8s ease-in-out infinite;
        }
      `}</style>

      <section ref={sectionRef} className="relative w-full bg-white py-16 lg:py-24 overflow-hidden">

        {/* Top-Left Corner Bluish Background */}
        <div className="absolute -top-24 -left-24 w-[400px] h-[400px] bg-blue-500/20 rounded-full filter blur-3xl opacity-60 pointer-events-none" />

        {/* Bottom-Right Corner Orange Background */}
        <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] bg-orange-500/20 rounded-full filter blur-3xl opacity-60 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10">
          {/* Header (Slide-down from top + fade effect) */}
          <div
            className={`text-center max-w-2xl mx-auto mb-12 lg:mb-16 scroll-fade-down ${isVisible ? 'active' : ''}`}
          >
            <span className="inline-block text-[#487bf2] font-bold text-xs sm:text-sm tracking-[0.08em] uppercase mb-2">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-3xl lg:text-[33px] font-extrabold text-[#0f1b3d] leading-[1.15] mb-3">
              FROM TRIP DETAILS TO DAILY LOGS 
            </h2>
            <p className="text-[#4b5570] text-sm sm:text-base">
              Plan your trip in three simple steps.
            </p>
          </div>

          {/* Steps Grid with Arrows exactly in the center gaps */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-14 w-full max-w-5xl mx-auto">
            {steps.map((step, index) => {
              const boxDelay = index * 0.08;
              const arrowDelay = index * 0.08 + 0.05;

              return (
                <div key={step.id} className="relative flex flex-col items-center w-full">

                  {/* BOX */}
                  <div
                    className={`relative w-full bg-white rounded-2xl p-6 flex flex-col border-t-4 border-b-4 border-[#f97316] shadow-sm hover:shadow-lg transition-shadow duration-300 scroll-fade-up ${showContent ? 'active' : ''}`}
                    style={{ animationDelay: `${boxDelay}s` }}
                  >
                    {/* Bluish + Orange Soft Shade */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/20 to-orange-50/60 rounded-2xl pointer-events-none" />
                    {/* Slow glowing effect */}
                    <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-2xl box-glow-pulse pointer-events-none" />

                    <div className="relative z-10 flex flex-col">

                      {/* Logo Box & Number Row */}
                      <div className="flex flex-row items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#487bf2] shrink-0">
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            {step.icon}
                          </svg>
                        </div>
                        <span className="text-[#1d3a61] font-bold text-xl tracking-tight leading-none">
                          {step.id}
                        </span>
                      </div>

                      {/* Text Below */}
                      <div>
                        <h3 className="text-[#0f1b3d] font-bold text-[17px] mb-1">{step.title}</h3>
                        <p className="text-[#4d66ac] text-sm leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </div>

                  {/* Arrow - ab exact gap ke center mein aayega */}
                  {index < steps.length - 1 && (
                    <div
                      className={`hidden md:flex absolute top-1/2 left-[calc(100%+1rem)] lg:left-[calc(100%+1.75rem)] -translate-x-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-[#487bf2] rounded-full items-center justify-center shadow-[0_4px_16px_rgba(72,123,242,0.35)] scroll-fade-up ${showContent ? 'active' : ''} bounce-arrow`}
                      style={{ animationDelay: `${arrowDelay}s` }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

export default HowItWorks;