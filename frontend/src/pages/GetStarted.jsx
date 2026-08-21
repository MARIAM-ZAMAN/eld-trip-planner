// src/pages/GetStarted.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.webp';
import { registerUser } from '../utils/storage';

const GetStarted = () => {
  const navigate = useNavigate();
  const takenEmails = ['test@example.com', 'demo@routelog.com'];

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formError, setFormError] = useState('');

  const isValidEmail = /^\S+@\S+\.\S+$/.test(email);
  const isEmailTaken = takenEmails.includes(email.trim().toLowerCase());

  const hasMinLength = password.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const handlePhoneChange = (e) => {
    const numericValue = e.target.value.replace(/[^0-9+\-\s()]/g, '');
    setPhone(numericValue);
  };

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!fullName || !isValidEmail || password.length < 8 || password !== confirmPassword || !agreeTerms) {
      setFormError('Enter your name, a valid email, matching passwords, and accept the terms.');
      return;
    }
    try {
      registerUser({ name: fullName, email, password });
      navigate('/dashboard');
    } catch (error) {
      setFormError(error.message);
    }
  };

  const styles = {
    page: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      padding: '2.5rem 1.5rem',
      margin: '0',
      background: 'linear-gradient(160deg, #eaf2ff 0%, #dbe9ff 45%, #eef4ff 100%)',
      fontFamily: 'Inter, sans-serif',
      boxSizing: 'border-box',
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    topArea: {
      width: '100%',
      maxWidth: '440px',
      textAlign: 'center',
      marginBottom: '1.4rem',
    },
    badge: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '0.6rem',
    },
    badgeLogo: {
      height: '64px',
      width: 'auto',
      display: 'block',
      objectFit: 'contain',
    },
    title: {
      fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)',
      fontWeight: 700,
      color: '#0a192f',
      marginBottom: '0.3rem',
      lineHeight: 1.2,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 'clamp(0.85rem, 1vw, 0.95rem)',
      color: '#64748b',
      marginBottom: '0',
      lineHeight: 1.5,
      textAlign: 'center',
    },
    card: {
      position: 'relative',
      width: '100%',
      maxWidth: '440px',
      background: 'radial-gradient(circle at 0% 0%, rgba(59,130,246,0.16), rgba(59,130,246,0) 55%), #ffffff',
      borderRadius: '20px',
      padding: '1.7rem 2.2rem 1.9rem',
      boxShadow: '0 10px 40px rgba(10,25,47,0.12)',
      border: '1px solid rgba(255,255,255,0.6)',
      overflow: 'hidden',
    },
    // ✅ Back to Home – top right inside card
    backHomeLink: {
      position: 'absolute',
      top: '1rem',
      right: '1.2rem',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: '#64748b',
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.2rem',
      transition: 'color 0.2s',
    },
    backHomeLinkHover: {
      color: '#0a192f',
    },
    cardHeading: {
      fontSize: '1.05rem',
      fontWeight: 700,
      color: '#1d4ed8',
      marginBottom: '0.15rem',
    },
    cardSubheading: {
      fontSize: '0.78rem',
      color: '#64748b',
      marginBottom: '1.2rem',
    },
    formGroup: {
      marginBottom: '0.55rem',
    },
    label: {
      display: 'block',
      fontSize: '0.65rem',
      fontWeight: 700,
      color: '#0a192f',
      marginBottom: '0.2rem',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    input: {
      width: '100%',
      padding: '0.55rem 0.9rem',
      fontSize: '0.85rem',
      border: '1.5px solid #e2e8f0',
      borderRadius: '10px',
      outline: 'none',
      transition: 'all 0.2s',
      background: '#ffffff',
      color: '#0a192f',
      boxSizing: 'border-box',
    },
    inputFocus: {
      borderColor: '#0a192f',
      background: '#ffffff',
      boxShadow: '0 0 0 3px rgba(10,25,47,0.06)',
    },
    row: {
      display: 'flex',
      gap: '0.8rem',
    },
    rowItem: {
      flex: 1,
    },
    inputWrapper: {
      position: 'relative',
    },
    unavailableTag: {
      position: 'absolute',
      right: '0.7rem',
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '0.68rem',
      fontWeight: 700,
      color: '#dc2626',
      display: 'flex',
      alignItems: 'center',
      gap: '0.2rem',
    },
    availableTag: {
      position: 'absolute',
      right: '0.7rem',
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '0.68rem',
      fontWeight: 700,
      color: '#16a34a',
      display: 'flex',
      alignItems: 'center',
      gap: '0.2rem',
    },
    button: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#0a192f',
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      fontSize: '0.95rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 4px 16px rgba(10,25,47,0.2)',
      marginTop: '0.3rem',
    },
    buttonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 28px rgba(10,25,47,0.3)',
      backgroundColor: '#132a5e',
    },
    hintList: {
      listStyle: 'none',
      padding: 0,
      margin: '0.35rem 0 0 0',
    },
    hintItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
      fontSize: '0.72rem',
      color: '#16a34a',
      marginBottom: '0.15rem',
    },
    hintItemMuted: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
      fontSize: '0.72rem',
      color: '#94a3b8',
      marginBottom: '0.15rem',
    },
    checkboxRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      margin: '0.7rem 0 0.3rem',
    },
    checkbox: {
      width: '16px',
      height: '16px',
      accentColor: '#16a34a',
      cursor: 'pointer',
      flexShrink: 0,
    },
    checkboxLabel: {
      fontSize: '0.78rem',
      color: '#334155',
      lineHeight: 1.4,
    },
    checkboxLink: {
      color: '#dd9b39',
      fontWeight: 700,
      cursor: 'pointer',
      textDecoration: 'none',
    },
    loginText: {
      fontSize: '0.8rem',
      color: '#64748b',
      textAlign: 'center',
      marginTop: '1rem',
    },
    loginLink: {
      color: '#1d4ed8',
      fontWeight: 700,
      cursor: 'pointer',
      textDecoration: 'none',
    },
    scrollbarStyle: `
      html {
        scrollbar-width: thin;
        scrollbar-color: #0a192f transparent;
      }
      ::-webkit-scrollbar {
        width: 8px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: #0a192f;
        border-radius: 10px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #132a5e;
      }
    `,
  };

  return (
    <div style={styles.page}>
      <style>{styles.scrollbarStyle}</style>
      <div style={styles.container}>
        <div style={styles.topArea}>
          <div style={styles.badge}>
            <img
              src={logo}
              alt="RouteLog Logo"
              width="160"
              height="64"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              style={styles.badgeLogo}
            />
          </div>
          <h1 style={styles.title}>Create Your Account</h1>
          <p style={styles.subtitle}>
            Sign up to start planning smarter, compliant routes.
          </p>
        </div>

        <div style={styles.card}>
          {/* ✅ Back to Home – top right */}
          <Link
            to="/"
            style={styles.backHomeLink}
            onMouseEnter={(e) => (e.target.style.color = '#0a192f')}
            onMouseLeave={(e) => (e.target.style.color = '#64748b')}
          >
            ← Back to Home
          </Link>

          <h2 style={styles.cardHeading}>Sign Up</h2>
          <p style={styles.cardSubheading}>Fill in your details to get started</p>

          <form onSubmit={handleSubmit}>
            {/* First & Last Name */}
            <div style={styles.row}>
              <div style={styles.rowItem}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>First Name</label>
                  <input
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    style={styles.input}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.background = '#ffffff';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
              <div style={styles.rowItem}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Last Name</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    style={styles.input}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.background = '#ffffff';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ ...styles.input, paddingRight: '6.4rem' }}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.background = '#ffffff';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {isValidEmail && (
                  isEmailTaken ? (
                    <span style={styles.unavailableTag}>✕ ALREADY TAKEN</span>
                  ) : (
                    <span style={styles.availableTag}>✓ AVAILABLE</span>
                  )
                )}
              </div>
            </div>

            {/* Phone */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone (Optional)</label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={handlePhoneChange}
                style={styles.input}
                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = '#ffffff';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = '#ffffff';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <ul style={styles.hintList}>
                <li style={hasMinLength ? styles.hintItem : styles.hintItemMuted}>
                  {hasMinLength ? '✓' : '○'} At least 8 characters
                </li>
                <li style={hasSpecialChar ? styles.hintItem : styles.hintItemMuted}>
                  {hasSpecialChar ? '✓' : '○'} One special character (!@#$%^&amp;...)
                </li>
              </ul>
            </div>

            {/* Confirm Password */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = '#ffffff';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Terms */}
            <div style={styles.checkboxRow}>
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                style={styles.checkbox}
              />
              <label htmlFor="agreeTerms" style={styles.checkboxLabel}>
                I agree to the{' '}
                <span style={styles.checkboxLink}>Terms &amp; Conditions</span> and{' '}
                <span style={styles.checkboxLink}>Privacy Policy</span>
              </label>
            </div>

            {formError && <p role="alert" style={{ color: '#dc2626', fontSize: '0.78rem', marginBottom: '0.5rem' }}>{formError}</p>}

            <button
              type="submit"
              style={styles.button}
              onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
              onMouseLeave={(e) => {
                e.target.style.transform = 'none';
                e.target.style.boxShadow = '0 4px 16px rgba(10,25,47,0.2)';
                e.target.style.backgroundColor = '#0a192f';
              }}
            >
              Create Account
            </button>
          </form>

          <p style={styles.loginText}>
            Already have an account?{' '}
            <Link to="/login" style={styles.loginLink}>
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;