import React, { useState, useEffect } from 'react';
import { getUserSettings, updateUserSettings } from '../api/api';
import PageHeader from '../components/PageHeader';

export default function Settings() {
  const [settings, setSettings] = useState({
    gemini_api_key: '',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_from_name: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getUserSettings();
      setSettings({
        gemini_api_key: data.gemini_api_key || '',
        smtp_host: data.smtp_host || 'smtp.gmail.com',
        smtp_port: data.smtp_port || 587,
        smtp_username: data.smtp_username || '',
        smtp_password: data.smtp_password || '',
        smtp_from_name: data.smtp_from_name || ''
      });
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updateUserSettings(settings);
      setMessage('Settings saved successfully!');
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div role="status" aria-live="polite" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
      Loading settings...
    </div>
  );

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <PageHeader
        title="Settings"
        description="Configure your Gemini and Gmail credentials. Keys are encrypted at rest."
      />

      {/* Feedback bars */}
      {message && (
        <div role="status" aria-live="polite" style={{
          borderLeft: '3px solid var(--status-replied-text)',
          background: 'var(--bg-elevated)',
          padding: '10px 14px',
          borderRadius: '4px',
          color: 'var(--text-primary)',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          {message}
        </div>
      )}
      {error && (
        <div role="alert" aria-live="assertive" style={{
          borderLeft: '3px solid #e53e3e',
          background: 'var(--bg-elevated)',
          padding: '10px 14px',
          borderRadius: '4px',
          color: '#fc8181',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: AI Configuration */}
        <div className="sa-card" style={{ padding: '24px', marginBottom: '16px' }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '12px',
            marginBottom: '16px',
            marginTop: 0
          }}>
            Gemini
          </h3>
          <div>
            <label htmlFor="gemini-key" className="sa-label">Gemini API Key</label>
            <input
              id="gemini-key"
              type="password"
              className="sa-input"
              value={settings.gemini_api_key}
              onChange={(e) => setSettings({...settings, gemini_api_key: e.target.value})}
              placeholder="AIzaSy..."
            />
            <p style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              Keys start with AIza and are 39 characters long. Get yours at aistudio.google.com.
            </p>
          </div>
        </div>

        {/* Section 2: Email Delivery */}
        <div className="sa-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '12px',
            marginBottom: '16px',
            marginTop: 0
          }}>
            Email
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="from-name" className="sa-label">From Name</label>
              <input
                id="from-name"
                type="text"
                className="sa-input"
                value={settings.smtp_from_name}
                onChange={(e) => setSettings({...settings, smtp_from_name: e.target.value})}
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label htmlFor="smtp-email" className="sa-label">Email Address</label>
              <input
                id="smtp-email"
                type="email"
                className="sa-input"
                value={settings.smtp_username}
                onChange={(e) => setSettings({...settings, smtp_username: e.target.value})}
                placeholder="you@gmail.com"
              />
            </div>

            <div>
              <label htmlFor="app-password" className="sa-label">App Password</label>
              <input
                id="app-password"
                type="password"
                className="sa-input"
                value={settings.smtp_password}
                onChange={(e) => setSettings({...settings, smtp_password: e.target.value})}
                placeholder="16-character app password"
              />
              <p style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                For Gmail: Google Account → Security → 2-Step Verification → App Passwords.
              </p>
            </div>

            {/* SMTP Host + Port on same row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '12px' }}>
              <div>
                <label htmlFor="smtp-host" className="sa-label">SMTP Host</label>
                <input
                  id="smtp-host"
                  type="text"
                  className="sa-input"
                  value={settings.smtp_host}
                  onChange={(e) => setSettings({...settings, smtp_host: e.target.value})}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label htmlFor="smtp-port" className="sa-label">Port</label>
                <input
                  id="smtp-port"
                  type="number"
                  className="sa-input"
                  value={settings.smtp_port}
                  onChange={(e) => setSettings({...settings, smtp_port: parseInt(e.target.value) || 587})}
                  placeholder="587"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={saving} className="sa-btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
