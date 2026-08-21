// src/components/CTASection.jsx

import { Link } from 'react-router-dom';
import CTAImage from '../assets/CTA.webp';

const CTASection = () => {
  const styles = {
    // ... your existing styles (no changes)
    section: {
      display: 'flex',
      justifyContent: 'center',
      padding: '1rem',
      background: '#f8fafc',
    },
    wrapper: {
      position: 'relative',
      width: '100%',
      maxWidth: '1200px',
      aspectRatio: '1280 / 230',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center',
      display: 'block',
      imageRendering: '-webkit-optimize-contrast',
    },
    overlay: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 5%',
      boxSizing: 'border-box',
    },
    content: {
      maxWidth: '48%',
      textAlign: 'left',
      color: '#ffffff',
    },
    title: {
      fontSize: 'clamp(1.1rem, 2.4vw, 1.9rem)',
      fontWeight: 700,
      margin: 0,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    subtitle: {
      fontSize: 'clamp(0.7rem, 1vw, 0.9rem)',
      margin: '0.5rem 0 1rem 0',
      lineHeight: 1.5,
      opacity: 0.95,
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.6rem',
      padding: '0.6rem 1.6rem',
      background: 'linear-gradient(180deg, rgba(30,41,59,0.9) 0%, rgba(10,17,32,0.95) 100%)',
      color: '#ffffff',
      fontSize: 'clamp(0.75rem, 1vw, 0.95rem)',
      fontWeight: 600,
      border: '1px solid rgba(255,255,255,0.18)',
      borderRadius: '10px',
      cursor: 'pointer',
      backdropFilter: 'blur(6px)',
      boxShadow:
        '0 4px 16px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 1px 0 rgba(255,255,255,0.15) inset',
      transition: 'all 0.25s ease',
      textDecoration: 'none',      // ensure no underline
    },
    buttonHover: {
      transform: 'translateY(-2px)',
      boxShadow:
        '0 6px 22px rgba(0,0,0,0.5), 0 0 18px rgba(59,130,246,0.45), 0 1px 0 rgba(255,255,255,0.2) inset',
      background: 'linear-gradient(180deg, rgba(40,53,74,0.95) 0%, rgba(15,23,42,1) 100%)',
    },
    arrow: {
      display: 'inline-flex',
      alignItems: 'center',
      transition: 'transform 0.3s ease',
    },
  };

  return (
    <section style={styles.section}>
      <div style={styles.wrapper}>
        <img
          src={CTAImage}
          alt="Trip Planning"
          width="602"
          height="96"
          loading="lazy"
          decoding="async"
          style={styles.image}
        />
        <div style={styles.overlay}>
          <div style={styles.content}>
            <h1 style={styles.title}>Ready to Plan Your Next Trip?</h1>
            <p style={styles.subtitle}>
              Join professional drivers who plan smarter, stay compliant, and drive with confidence.
            </p>
            {/* 👇 Wrap button with Link */}
            <Link to="/get-started" style={{ textDecoration: 'none' }}>
              <button
                style={styles.button}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, styles.buttonHover);
                  const arrow = e.currentTarget.querySelector('span');
                  if (arrow) arrow.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, {
                    transform: 'none',
                    boxShadow: styles.button.boxShadow,
                    background: styles.button.background,
                  });
                  const arrow = e.currentTarget.querySelector('span');
                  if (arrow) arrow.style.transform = 'translateX(0)';
                }}
              >
                Get Started
                <span style={styles.arrow}>→</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;