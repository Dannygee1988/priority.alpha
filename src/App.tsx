import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Data from './pages/Data';
import RNSGenerator from './pages/RNSGenerator';
import ImproveRNS from './pages/ImproveRNS';
import PublishedRNS from './pages/PublishedRNS';
import RNSDrafts from './pages/RNSDrafts';
import CRM from './pages/CRM';
import Insiders from './pages/Insiders';
import Settings from './pages/Settings';
import Advisor from './pages/Advisor';
import Gallery from './pages/Gallery';
import AppLayout from './layouts/AppLayout';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/data" element={<Data />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/pr/rns/write" element={<RNSGenerator />} />
            <Route path="/pr/rns/improve" element={<ImproveRNS />} />
            <Route path="/pr/rns/published" element={<PublishedRNS />} />
            <Route path="/pr/rns/drafts" element={<RNSDrafts />} />
            <Route path="/investors/insiders" element={<Insiders />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/advisor" element={<Advisor />} />
            <Route path="/social-media/gallery" element={<Gallery />} />
            {/* Add more routes as they're developed */}
            <Route path="/analytics" element={<div className="p-8">Analytics page (coming soon)</div>} />
            <Route path="/team" element={<div className="p-8">Team Management page (coming soon)</div>} />
            <Route path="/projects" element={<div className="p-8">Projects page (coming soon)</div>} />
            <Route path="/messages" element={<div className="p-8">Messaging page (coming soon)</div>} />
            <Route path="/calendar" element={<div className="p-8">Calendar page (coming soon)</div>} />
            <Route path="/finance" element={<div className="p-8">Financial Reports page (coming soon)</div>} />
            <Route path="/resources" element={<div className="p-8">Resources page (coming soon)</div>} />
          </Route>
          
          {/* Redirect to login by default */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;