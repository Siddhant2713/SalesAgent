import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import UploadPage from './pages/UploadPage';
import CampaignPage from './pages/CampaignPage';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

function NavBar() {
  const location = useLocation();
  const { logout } = useAuth();
  const navClass = (path) => 
    `px-3 py-2 rounded-md text-sm font-medium ${location.pathname === path ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`;

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-white font-bold text-xl">SalesAgent</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className={navClass('/')}>Upload Leads</Link>
                <Link to="/campaign" className={navClass('/campaign')}>Campaigns</Link>
                <Link to="/dashboard" className={navClass('/dashboard')}>Dashboard</Link>
                <Link to="/settings" className={navClass('/settings')}>Settings</Link>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <button onClick={logout} className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-white focus:text-blue-600 focus:p-4">
          Skip to main content
        </a>
        <NavBar />
        <main id="main-content" className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/campaign" element={<CampaignPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
