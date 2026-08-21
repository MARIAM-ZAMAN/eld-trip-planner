// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';   // ✅ useNavigate added
import logo from '../assets/logo.webp';
import { authenticateUser, setCurrentUser } from '../utils/storage';

const Login = () => {
  const navigate = useNavigate();   // ✅ navigation hook

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // ✅ handle sign in with dummy authentication
  const handleSignIn = (e) => {
    e.preventDefault();
    setLoginError('');

    const cleanInput = username.trim().toLowerCase();

    // Validate dummy credentials (dummy / 1234) or fallback demo accounts
    const registeredUser = authenticateUser(cleanInput, password);
    if (registeredUser || (
      (cleanInput === 'dummy' || cleanInput === 'dummy@example.com' || cleanInput === 'mariam@gmail.com') &&
      password === '1234'
    )) {
      const userProfile = {
        username: cleanInput === 'dummy' ? 'dummy' : cleanInput,
        name: cleanInput === 'dummy' ? 'Dummy Driver' : 'Mariam',
        email: cleanInput.includes('@') ? cleanInput : `${cleanInput}@eldplanner.com`,
        role: 'Commercial Driver',
      };
      if (!registeredUser) setCurrentUser({ ...userProfile, password });
      navigate('/dashboard');
    } else {
      setLoginError('Invalid credentials. Please use username: dummy and password: 1234');
    }
  };

  const handleFillDemo = () => {
    setUsername('dummy');
    setPassword('1234');
    setLoginError('');
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    setResetError('');

    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setResetError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setResetSent(true);
  };

  const backToLogin = () => {
    setShowForgot(false);
    setResetSent(false);
    setResetError('');
    setResetEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setAgreeTerms(false);
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
      marginBottom: '0.9rem',
    },
    labelRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '0.2rem',
    },
    label: {
      display: 'block',
      fontSize: '0.65rem',
      fontWeight: 700,
      color: '#0a192f',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    forgotLink: {
      fontSize: '0.72rem',
      fontWeight: 700,
      color: '#1d4ed8',
      cursor: 'pointer',
      textDecoration: 'none',
    },
    input: {
      width: '100%',
      padding: '0.6rem 0.9rem',
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
    checkboxRow: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.5rem',
      margin: '0.2rem 0 1rem',
    },
    checkbox: {
      width: '16px',
      height: '16px',
      accentColor: '#1d4ed8',
      cursor: 'pointer',
      flexShrink: 0,
      marginTop: '0.15rem',
    },
    checkboxLabel: {
      fontSize: '0.78rem',
      color: '#334155',
      cursor: 'pointer',
      lineHeight: 1.4,
    },
    inlineLink: {
      color: '#1d4ed8',
      fontWeight: 600,
      textDecoration: 'none',
    },
    errorBox: {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '10px',
      padding: '0.6rem 0.8rem',
      fontSize: '0.75rem',
      color: '#b91c1c',
      marginBottom: '0.8rem',
    },
    demoBadge: {
      background: 'rgba(37, 99, 235, 0.08)',
      border: '1px dashed #93c5fd',
      borderRadius: '10px',
      padding: '0.55rem 0.75rem',
      fontSize: '0.75rem',
      color: '#1e40af',
      marginBottom: '0.9rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.5rem',
    },
    demoButton: {
      background: '#2563eb',
      color: '#ffffff',
      border: 'none',
      borderRadius: '6px',
      padding: '0.25rem 0.6rem',
      fontSize: '0.7rem',
      fontWeight: 600,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'background 0.2s',
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
      marginTop: '0.2rem',
    },
    buttonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 28px rgba(10,25,47,0.3)',
      backgroundColor: '#132a5e',
    },
    signupText: {
      fontSize: '0.8rem',
      color: '#64748b',
      textAlign: 'center',
      marginTop: '1.1rem',
    },
    signupLink: {
      color: '#1d4ed8',
      fontWeight: 700,
      cursor: 'pointer',
      textDecoration: 'none',
    },
    backLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      fontSize: '0.78rem',
      fontWeight: 700,
      color: '#1d4ed8',
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      padding: 0,
      marginBottom: '1rem',
    },
    successBox: {
      background: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: '12px',
      padding: '0.9rem 1rem',
      fontSize: '0.8rem',
      color: '#166534',
      lineHeight: 1.5,
      marginBottom: '0.5rem',
    },
    footerNote: {
      fontSize: '0.68rem',
      color: '#94a3b8',
      textAlign: 'center',
      marginTop: '1.4rem',
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
          <h1 style={styles.title}>Welcome Back</h1>
          <p style={styles.subtitle}>
            Log in to keep planning smarter, compliant routes.
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

          {!showForgot ? (
            <>
              <h2 style={styles.cardHeading}>Sign In</h2>
              <p style={styles.cardSubheading}>Enter your credentials to continue</p>

              {/* Demo Helper Box */}
              <div style={styles.demoBadge}>
                <div>
                  <span style={{ fontWeight: 700 }}>Demo Login:</span> User: <code>dummy</code> &middot; Pass: <code>1234</code>
                </div>
                <button
                  type="button"
                  style={styles.demoButton}
                  onClick={handleFillDemo}
                  onMouseEnter={(e) => (e.target.style.background = '#1d4ed8')}
                  onMouseLeave={(e) => (e.target.style.background = '#2563eb')}
                >
                  Auto-Fill
                </button>
              </div>

              {loginError && <div style={styles.errorBox}>{loginError}</div>}

              <form onSubmit={handleSignIn}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Username or Email</label>
                  <input
                    type="text"
                    placeholder="Enter username (e.g. dummy)"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    required
                    style={styles.input}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.background = '#ffffff';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={styles.formGroup}>
                  <div style={styles.labelRow}>
                    <label style={styles.label}>Password</label>
                    <span style={styles.forgotLink} onClick={() => setShowForgot(true)}>
                      Forgot password?
                    </span>
                  </div>
                  <input
                    type="password"
                    placeholder="Enter your password (e.g. 1234)"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    required
                    style={styles.input}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.background = '#ffffff';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <label htmlFor="rememberMe" style={styles.checkboxLabel}>
                    Remember me
                  </label>
                </div>

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
                  Sign In
                </button>
              </form>

              <p style={styles.signupText}>
                Don't have an account?{' '}
                <Link to="/get-started" style={styles.signupLink}>
                  Sign Up
                </Link>
              </p>
            </>
          ) : (
            <>
              <button style={styles.backLink} onClick={backToLogin} type="button">
                ← Back to Sign In
              </button>

              {!resetSent ? (
                <>
                  <h2 style={styles.cardHeading}>Reset your password</h2>
                  <p style={styles.cardSubheading}>
                    Your new password must be different from previously used passwords.
                  </p>

                  {resetError && <div style={styles.errorBox}>{resetError}</div>}

                  <form onSubmit={handleResetSubmit}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Email</label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        style={styles.input}
                        onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.background = '#ffffff';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={styles.input}
                        onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.background = '#ffffff';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Confirm Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
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
                        <Link to="/terms" style={styles.inlineLink}>Terms of Service</Link>{' '}
                        and{' '}
                        <Link to="/privacy" style={styles.inlineLink}>Privacy Policy</Link>.
                      </label>
                    </div>

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
                      Reset password
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h2 style={styles.cardHeading}>Reset your password</h2>
                  <div style={styles.successBox}>
                    ✅ Your password has been reset successfully. You can now sign in with
                    your new password.
                  </div>
                  <button
                    type="button"
                    style={{ ...styles.button, marginTop: '0.6rem' }}
                    onClick={backToLogin}
                    onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'none';
                      e.target.style.boxShadow = '0 4px 16px rgba(10,25,47,0.2)';
                      e.target.style.backgroundColor = '#0a192f';
                    }}
                  >
                    Back to Sign In
                  </button>
                </>
              )}
            </>
          )}
        </div>

        <p style={styles.footerNote}>🔒 Secure login &middot; Your data stays encrypted</p>
      </div>
    </div>
  );
};

export default Login;