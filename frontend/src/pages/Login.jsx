import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { loginUser, registerUser } from '../api/api';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegistering) {
        await registerUser(email, password);
        const data = await loginUser(email, password);
        login(data.access_token);
      } else {
        const data = await loginUser(email, password);
        login(data.access_token);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '24px'
    }}>
      {/* Logo */}
      <div style={{
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '48px'
      }}>
        SalesAgent
      </div>

      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: '24px', maxWidth: '400px', width: '100%' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          margin: 0
        }}>
          {isRegistering ? 'Create your account' : 'Welcome back'}
        </h2>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginTop: '4px'
        }}>
          {isRegistering ? 'Set up takes 2 minutes.' : 'Sign in to continue.'}
        </p>
      </div>

      {/* Form card */}
      <div className="sa-card sa-fade-in" style={{
        padding: '28px',
        borderRadius: '10px',
        maxWidth: '400px',
        width: '100%'
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="email" className="sa-label">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="sa-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="password" className="sa-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="sa-input"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="sa-shake"
              style={{
                borderLeft: '3px solid #e53e3e',
                color: '#fc8181',
                fontSize: '13px',
                padding: '10px 12px',
                marginBottom: '16px',
                borderRadius: '4px'
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="sa-btn-primary"
            style={{ width: '100%', padding: '11px 18px', opacity: loading ? 0.7 : 1 }}
          >
            <span role="status" aria-live="polite">
              {loading ? 'Verifying...' : (isRegistering ? 'Register' : 'Sign In')}
            </span>
          </button>
        </form>
      </div>

      {/* Toggle */}
      <div style={{ marginTop: '16px', fontSize: '13px', textAlign: 'center' }}>
        <span style={{ color: 'var(--text-muted)' }}>
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
        </span>
        <button
          type="button"
          onClick={() => setIsRegistering(!isRegistering)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--blue-primary)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            padding: 0,
            transition: 'color 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--blue-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--blue-primary)'; }}
        >
          {isRegistering ? 'Sign in' : 'Register'}
        </button>
      </div>
    </div>
  );
}
