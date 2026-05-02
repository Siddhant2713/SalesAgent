import React, { useState, useEffect } from 'react';
import { getUserSettings, updateUserSettings } from '../api/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    gemini_api_key: '',
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

  if (loading) return <div role="status" aria-live="polite" className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Account Settings</h2>
          <p className="mt-1 text-sm text-gray-500">Configure your API keys and email credentials.</p>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        {message && <div role="status" aria-live="polite" className="mb-4 bg-green-50 p-4 rounded-md text-green-800">{message}</div>}
        {error && <div role="alert" aria-live="assertive" className="mb-4 bg-red-50 p-4 rounded-md text-red-800">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-2">AI Configuration</h3>
            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
              <div className="sm:col-span-2">
                <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-700">Gemini API Key</label>
                <input
                  id="gemini-key"
                  type="password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={settings.gemini_api_key}
                  onChange={(e) => setSettings({...settings, gemini_api_key: e.target.value})}
                  placeholder="AIzaSy..."
                />
                <p className="mt-1 text-xs text-gray-500">Get this from Google AI Studio.</p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-2">Email Delivery (SMTP)</h3>
            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
              <div className="sm:col-span-2">
                <label htmlFor="from-name" className="block text-sm font-medium text-gray-700">From Name</label>
                <input
                  id="from-name"
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={settings.smtp_from_name}
                  onChange={(e) => setSettings({...settings, smtp_from_name: e.target.value})}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="gmail-address" className="block text-sm font-medium text-gray-700">Gmail Address</label>
                <input
                  id="gmail-address"
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={settings.smtp_username}
                  onChange={(e) => setSettings({...settings, smtp_username: e.target.value})}
                  placeholder="you@gmail.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="app-password" className="block text-sm font-medium text-gray-700">Gmail App Password</label>
                <input
                  id="app-password"
                  type="password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={settings.smtp_password}
                  onChange={(e) => setSettings({...settings, smtp_password: e.target.value})}
                  placeholder="16-character app password"
                />
                <p className="mt-1 text-xs text-gray-500">Must be an App Password, not your real password.</p>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
