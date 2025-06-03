import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const AppLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

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
        <Header />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      {/* Modal overlay */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity duration-300 pointer-events-none"
        style={{ 
          opacity: document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50') ? 1 : 0,
          zIndex: 40 
        }}
      />
    </div>
  );
};

export default AppLayout;