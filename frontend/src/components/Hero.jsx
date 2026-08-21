import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import heroBg from '../assets/hero-bg.webp';
import heroBgMobile from '../assets/hero-bg-mobile.webp';

// ----------------------
// 1. Existing Icons
// ----------------------
function ShieldIcon() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 shrink-0 overflow-hidden">
      <svg width="16" height="16" style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.5 12l1.8 1.8L14.5 10" />
      </svg>
    </span>
  );
}

// ✅ ArrowIcon is kept but NOT used in the button


// ----------------------
// 2. GetStartedButton – replaced button with Link, removed arrow
// ----------------------
function GetStartedButton() {
  return (
    <Link
      to="/get-started"
      className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold tracking-wide text-white text-sm sm:text-base bg-[#4a88f6] shadow-[0_8px_28px_rgba(74,136,246,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(74,136,246,0.55)]"
    >
      <span className="absolute -inset-2.5 -z-10 rounded-full bg-[#4a88f6] opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-60" />
      <span>Get Started</span>
      {/* ✅ No arrow icon */}
    </Link>
  );
}

// FeatureBoxes (unchanged)
function FeatureBoxes() {
  const boxes = [
    { title: 'FMCSA Compliant', subtitle: '100% HOS Rules', color: 'text-green-500' },
    { title: '70hr / 8 Day Cycle', subtitle: 'Property Carrying', color: 'text-blue-500' },
    { title: 'Smart Rest Planning', subtitle: 'Optimal Stops', color: 'text-purple-500' },
    { title: 'Fuel Every 1,000 mi', subtitle: 'Automatic Planning', color: 'text-blue-500' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
      {boxes.map((box, idx) => (
        <div
          key={idx}
          className="group relative bg-white rounded-xl p-3 flex items-center gap-3 border-t-4 border-t-[#f97316] border border-gray-100/80 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_10px_25px_-5px_rgba(59,130,246,0.3)]"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-500/30 via-blue-400/10 to-transparent rounded-full blur-2xl pointer-events-none z-0" />
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-16 bg-blue-400/20 blur-xl pointer-events-none z-0" />

          <div className="relative z-10 flex items-center gap-3 w-full">
            <div className={`shrink-0 w-6 h-6 ${box.color}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {idx === 0 && (<g><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></g>)}
                {idx === 1 && (<g><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></g>)}
                {idx === 2 && (<g><path d="M4 12h16v6H4v-6z" /><path d="M4 8h16v4H4V8z" /><path d="M2 18h20" /></g>)}
                {idx === 3 && (<g><path d="M4 4v16h12V4H4z" /><path d="M16 8h4v4h-4" /><path d="M20 12l3 3v4h-3" /></g>)}
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[13px] font-bold text-[#0f1b3d] leading-tight">{box.title}</span>
              <span className="text-[11px] text-[#4b5570] leading-tight">{box.subtitle}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ----------------------
// 3. TrustBar (unchanged)
// ----------------------
function TrustBar() {
  const items = [
    'Stay HOS Compliant',
    'Save Time on Planning',
    'Drive More Efficiently',
    'Plan with Confidence'
  ];

  return (
    <>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 22s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="w-full bg-orange-100 border-y border-orange-200 overflow-hidden py-3">
        <div className="flex w-max animate-marquee">
          {/* 1st Set */}
          <div className="flex items-center gap-6 sm:gap-10 whitespace-nowrap px-6">
            <div className="flex items-center gap-2 text-[#0f1b3d] font-medium text-xs sm:text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Trusted by Professional Drivers
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[#0f1b3d] font-medium text-xs sm:text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#487bf2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* 2nd Set (duplicate) */}
          <div className="flex items-center gap-6 sm:gap-10 whitespace-nowrap px-6">
            <div className="flex items-center gap-2 text-[#0f1b3d] font-medium text-xs sm:text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Trusted by Professional Drivers
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[#0f1b3d] font-medium text-xs sm:text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#487bf2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ----------------------
// 4. HeroText (unchanged except using GetStartedButton)
// ----------------------
function HeroText() {
  const lines = ['PLAN SMARTER.', 'DRIVE SAFER.', 'STAY COMPLIANT.'];
  const totalLength = lines.reduce((sum, line) => sum + line.length, 0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showRest, setShowRest] = useState(false);

  useEffect(() => {
    let typeInterval;
    let revealTimeout;

    const startTimeout = setTimeout(() => {
      let count = 0;
      typeInterval = setInterval(() => {
        count += 1;
        setVisibleCount(count);
        if (count >= totalLength) {
          clearInterval(typeInterval);
          revealTimeout = setTimeout(() => setShowRest(true), 120);
        }
      }, 18);
    }, 200);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(revealTimeout);
      if (typeInterval) clearInterval(typeInterval);
    };
  }, [totalLength]);

  const isDone = visibleCount >= totalLength;
  let consumed = 0;

  return (
    <>
      <style>{`
        @keyframes heroFadeUp {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .hero-badge-in { animation: heroFadeUp 0.45s ease-out forwards; }
        .hero-rest-in { animation: heroFadeUp 0.45s ease-out forwards; }
      `}</style>

      <div className="hero-badge-in inline-flex items-center gap-2 bg-[#eff6ff] text-[#2563eb] text-xs sm:text-sm font-semibold px-4 py-2 rounded-full mb-4">
        <ShieldIcon />
        Smart HOS &amp; ELD Trip Planning
      </div>

      <h1 className="uppercase text-3xl sm:text-4xl lg:text-[44px] font-extrabold leading-[1.2] mb-3">
        {lines.map((line, idx) => {
          const start = consumed;
          consumed += line.length;
          const shown = Math.max(0, Math.min(line.length, visibleCount - start));
          const isTypingThisLine = visibleCount > start && visibleCount <= start + line.length;

          let colorClass;
          if (idx === 0) colorClass = 'text-[#0f1b3d]';
          else if (idx === 1) colorClass = 'text-[#487bf2]';
          else colorClass = 'text-[#14224a]';

          return (
            <span key={line}>
              <span className={colorClass} style={{ display: 'block' }}>
                {line.slice(0, shown)}
                {!isDone && isTypingThisLine && (
                  <span className="inline-block w-[3px] h-[0.8em] bg-[#487bf2] ml-1 align-middle animate-pulse" />
                )}
              </span>
            </span>
          );
        })}
      </h1>

      <p className={`text-sm sm:text-base text-[#4b5570] max-w-md mb-5 leading-relaxed ${showRest ? 'hero-rest-in' : 'opacity-0'}`}>
        Plan legal routes, optimize rest stops, and generate ELD compliant daily logs in seconds.
      </p>

      <div className={`${showRest ? 'hero-rest-in' : 'opacity-0'} mt-7`} style={{ animationDelay: showRest ? '0.12s' : '0s' }}>
        <GetStartedButton />
        <div className="mt-22">
          <FeatureBoxes />
        </div>
      </div>
    </>
  );
}

// ----------------------
// 5. Hero Layout (unchanged)
// ----------------------
function Hero() {
  return (
    <>
      <section className="relative w-full bg-white overflow-hidden">
        <div className="lg:hidden px-6 sm:px-10 pt-28 pb-8">
          <HeroText />
        </div>

        <div className="relative">
          <picture>
            <source media="(max-width: 768px)" srcSet={heroBgMobile} type="image/webp" />
            <source srcSet={heroBg} type="image/webp" />
            <img
              src={heroBg}
              alt="Hero background"
              width="1565"
              height="1005"
              fetchpriority="high"
              loading="eager"
              decoding="async"
              className="w-full h-auto object-contain"
              style={{ aspectRatio: '1565 / 1005' }}
            />
          </picture>

          <div className="hidden lg:flex absolute inset-0 items-start">
            <div className="max-w-xl px-10 xl:px-16 pt-40 xl:pt-48">
              <HeroText />
            </div>
          </div>
        </div>
      </section>

      <TrustBar />
    </>
  );
}

export default Hero;