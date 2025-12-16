import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const AppLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Check if any modals are open by looking for modal-related state params
  const hasModalOpen = location.search.includes('modal=') || 
                      document.body.classList.contains('modal-open');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <Sidebar />
      <div className="flex-1 transition-all duration-300 ml-20 lg:ml-64">
        <div className={`transition-colors duration-300 ${hasModalOpen ? 'bg-black/50' : ''}`}>
          <Header />
        </div>
        <main className={`pl-4 pr-8 py-6 transition-colors duration-300 ${hasModalOpen ? 'bg-black/50' : ''}`}>
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;