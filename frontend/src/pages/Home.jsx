// src/pages/Home.jsx
import { useEffect } from 'react';

import Header from '../components/Header';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import HOSRules from '../components/HOSRules';
import KnowYourCycle from '../components/KnowYourCycle';
import RouteSection from '../components/RouteSection';
import Logs from '../components/Logs';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer'

function Home() {
  // Optional: handle direct hash load (e.g., /#how-it-works)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  }, []);

  return (
    <div>
      <Header />
      <Hero />

      {/* Sections with IDs that match the Header links */}
      <section id="how-it-works">
        <HowItWorks />
      </section>

      <section id="hos-rules">
        <HOSRules />
      </section>

      <section id="know-your-cycle">
        <KnowYourCycle />
      </section>

      <section id="route">
        <RouteSection />
      </section>

      <section id="logs">
        <Logs />
      </section>

      <CTASection />
       <Footer />
    </div>
  );
}

export default Home;