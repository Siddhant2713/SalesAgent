import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { getUserSettings } from './api/api';

import Login from './pages/Login';
import UploadPage from './pages/UploadPage';
import CampaignPage from './pages/CampaignPage';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';

import Sidebar from './components/Sidebar';

function AuthenticatedLayout() {
  const [checking, setChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const isDone = localStorage.getItem('salesagent_onboarded');
    if (isDone) {
      setChecking(false);
      return;
    }

    getUserSettings()
      .then(settings => {
        if (!settings.gemini_api_key && !settings.smtp_username) {
          setNeedsOnboarding(true);
        } else {
          // They already have settings, maybe from an old session
          localStorage.setItem('salesagent_onboarded', '1');
        }
      })
      .catch(() => {
        // If settings fail to load, fail open
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="sa-pulse" style={{ height: '4px', width: '100px', background: 'var(--bg-elevated)', borderRadius: '2px' }} />
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding onComplete={() => {
      localStorage.setItem('salesagent_onboarded', '1');
      setNeedsOnboarding(false);
    }} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <a href="#main-content" className="sr-only focus:not-sr-only" style={{ position: 'absolute', top: 0, left: 0, zIndex: 100, background: 'var(--bg-surface)', padding: '12px' }}>
        Skip to main content
      </a>
      
      <Sidebar />
      
      <main id="main-content" style={{ 
        flex: 1, 
        marginLeft: '220px', 
        padding: '32px 40px',
        boxSizing: 'border-box'
      }}>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/campaign" element={<CampaignPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/*" element={isAuthenticated ? <AuthenticatedLayout /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
