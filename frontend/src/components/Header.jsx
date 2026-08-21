// src/components/Header.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.webp';

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Map display text to section IDs (must match those in Home.jsx)
  const navLinks = [
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'HOS Rules', id: 'hos-rules' },
    { label: 'Know Your Cycle', id: 'know-your-cycle' },
    { label: 'Route', id: 'route' },
    { label: 'DailyLogs', id: 'logs' },
  ];

  const navyText = 'text-[#14224a]';

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    setIsMenuOpen(false);
    // If already on home page, scroll directly
    if (window.location.pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Navigate to home with hash
      window.location.href = `/#${sectionId}`;
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-[0_4px_24px_rgba(20,34,74,0.12)] py-2.5'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-6">

        {/* Logo - Left */}
        <div className="flex items-center shrink-0">
          <Link to="/">
            <img
              src={logo}
              alt="RouteLog Logo"
              width="102"
              height="68"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              className="h-14 sm:h-16 lg:h-[68px] w-auto object-contain transition-all duration-300"
            />
          </Link>
        </div>

        {/* Nav Links - Center */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map(({ label, id }) => {
            const isActive = activeLink === id;
            return (
              <a
                key={id}
                href={`/#${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveLink(id);
                  handleNavClick(e, id);
                }}
                className={`relative text-sm font-semibold py-1 transition-colors duration-200 ${
                  isActive ? 'text-[#3155d4]' : `${navyText} hover:text-[#3155d4]`
                }`}
              >
                {label}
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] rounded-full bg-[#3155d4] transition-all duration-300 ${
                    isActive ? 'w-full' : 'w-0'
                  }`}
                />
              </a>
            );
          })}
        </nav>

        {/* Buttons - Right */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          <Link
            to="/login"
            className={`px-5 py-2 rounded-full font-semibold text-sm ${navyText} bg-transparent border border-[#14224a]/25 hover:border-[#3155d4] hover:text-[#3155d4] hover:bg-[#eaf0ff] transition-all duration-200`}
          >
            Login
          </Link>
          <Link
            to="/get-started"
            className="px-6 py-2.5 rounded-full font-semibold text-sm text-white bg-[#0a1a3c] shadow-[0_4px_16px_rgba(10,26,60,0.35)] transition-all duration-200 hover:bg-[#132a5e] hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`lg:hidden ${navyText}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-[#14224a]/10 px-4 py-6 flex flex-col gap-1">
          {navLinks.map(({ label, id }) => (
            <a
              key={id}
              href={`/#${id}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveLink(id);
                setIsMenuOpen(false);
                handleNavClick(e, id);
              }}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                activeLink === id ? 'text-[#3155d4] bg-[#3155d4]/5' : `${navyText} hover:bg-[#14224a]/5`
              }`}
            >
              {label}
            </a>
          ))}
          <div className="flex flex-col gap-3 mt-4">
            <Link
              to="/login"
              onClick={() => setIsMenuOpen(false)}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm text-center ${navyText} border border-[#14224a]/25 hover:border-[#3155d4] hover:text-[#3155d4]`}
            >
              Login
            </Link>
            <Link
              to="/get-started"
              onClick={() => setIsMenuOpen(false)}
              className="px-6 py-2.5 rounded-full font-semibold text-sm text-white bg-[#0a1a3c] text-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;