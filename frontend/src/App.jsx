import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import CampaignPage from './pages/CampaignPage';
import Dashboard from './pages/Dashboard';

function NavBar() {
  const location = useLocation();
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <NavBar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/campaign" element={<CampaignPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
