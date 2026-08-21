import logo from '../assets/logo.webp';

function Footer() {
  const currentYear = new Date().getFullYear();

  // Smooth scroll function for links
  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative w-full bg-[#0b1e33] pt-16 pb-8 overflow-hidden">
      
      {/* Piyara si Stylish Gradient Line (Top par) */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10">
        
        {/* Main Footer Grid - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12 mb-10">
          
          {/* ✅ Column 1: Logo (Aapki demand ke mutabiq left shift kar diya) */}
          <div className="flex flex-col gap-5">
            {/* ✅ Logo mein '-ml-2' add kar diya hai taake yeh bilkul left edge se start ho */}
            <img 
              src={logo} 
              alt="RouteLog Logo" 
              width="132"
              height="88"
              loading="lazy"
              decoding="async"
              className="h-22 w-auto object-contain -ml-2" 
            />
            
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Plan legal routes, optimize rest stops, and generate ELD compliant daily logs in seconds.
            </p>
          </div>

          {/* Column 2: PRODUCT Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#how-it-works" 
                  onClick={(e) => handleNavClick(e, 'how-it-works')} 
                  className="flex items-center text-gray-400 text-sm hover:text-[#60a5fa] transition-colors duration-200 cursor-pointer group"
                >
                  <svg className="w-3.5 h-3.5 text-[#60a5fa] mr-2 group-hover:translate-x-1 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                  How It Works
                </a>
              </li>
              <li>
                <a 
                  href="#hos-rules" 
                  onClick={(e) => handleNavClick(e, 'hos-rules')} 
                  className="flex items-center text-gray-400 text-sm hover:text-[#60a5fa] transition-colors duration-200 cursor-pointer group"
                >
                  <svg className="w-3.5 h-3.5 text-[#60a5fa] mr-2 group-hover:translate-x-1 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                  HOS Rules
                </a>
              </li>
              <li>
                <a 
                  href="#cycle-section" 
                  onClick={(e) => handleNavClick(e, 'cycle-section')} 
                  className="flex items-center text-gray-400 text-sm hover:text-[#60a5fa] transition-colors duration-200 cursor-pointer group"
                >
                  <svg className="w-3.5 h-3.5 text-[#60a5fa] mr-2 group-hover:translate-x-1 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                  Know Your Cycle
                </a>
              </li>
              <li>
                <a 
                  href="#route-section" 
                  onClick={(e) => handleNavClick(e, 'route-section')} 
                  className="flex items-center text-gray-400 text-sm hover:text-[#60a5fa] transition-colors duration-200 cursor-pointer group"
                >
                  <svg className="w-3.5 h-3.5 text-[#60a5fa] mr-2 group-hover:translate-x-1 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                  Route
                </a>
              </li>
              <li>
                <a 
                  href="#daily-logs" 
                  onClick={(e) => handleNavClick(e, 'daily-logs')} 
                  className="flex items-center text-gray-400 text-sm hover:text-[#60a5fa] transition-colors duration-200 cursor-pointer group"
                >
                  <svg className="w-3.5 h-3.5 text-[#60a5fa] mr-2 group-hover:translate-x-1 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                  Daily Logs
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: GET IN TOUCH */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Get In Touch</h4>
            <div className="flex flex-col gap-2 text-gray-400 text-sm">
              <p>Have questions about our ELD solutions?</p>
            </div>
            <a href="mailto:support@routelog.com" className="text-[#60a5fa] font-semibold text-sm hover:underline">
              support@routelog.com
            </a>
          </div>
        </div>

        {/* Footer Bottom / Copyright */}
        <div className="border-t border-gray-700/50 pt-6 flex justify-center sm:justify-start">
          <p className="text-gray-500 text-xs">
            &copy; {currentYear} RouteLog. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;