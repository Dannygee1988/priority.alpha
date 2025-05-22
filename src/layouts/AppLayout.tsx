import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const AppLayout: React.FC = () => {
  const { user, logout, isLoading } = useAuth();

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
        <Header user={user} onLogout={logout} />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        <footer className="bg-white border-t border-neutral-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-neutral-500">
                &copy; {new Date().getFullYear()} Pri0r1ty. All rights reserved.
              </p>
              <div className="mt-3 md:mt-0 flex space-x-4">
                <a href="#" className="text-sm text-neutral-500 hover:text-primary">
                  Privacy
                </a>
                <a href="#" className="text-sm text-neutral-500 hover:text-primary">
                  Terms
                </a>
                <a href="#" className="text-sm text-neutral-500 hover:text-primary">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;