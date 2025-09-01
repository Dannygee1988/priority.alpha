import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import UpgradeModal from '../components/UpgradeModal';

const AppLayout: React.FC = () => {
  const { user, isLoading, hasFeatureAccess } = useAuth();
  const location = useLocation();

  // Check if any modals are open by looking for modal-related state params
  const hasModalOpen = location.search.includes('modal=') || 
                      document.body.classList.contains('modal-open');

  // Check if current route requires feature access
  const getCurrentFeature = () => {
    const path = location.pathname;
    if (path.startsWith('/gpt')) return 'gpt';
    if (path.startsWith('/chats')) return 'chats';
    if (path.startsWith('/advisor')) return 'advisor';
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/data')) return 'data';
    if (path.startsWith('/crm')) return 'crm';
    if (path.startsWith('/social-media')) return 'social-media';
    if (path.startsWith('/pr')) return 'pr';
    if (path.startsWith('/finance')) return 'finance';
    if (path.startsWith('/analytics')) return 'analytics';
    if (path.startsWith('/hr')) return 'hr';
    if (path.startsWith('/investors')) return 'investors';
    if (path.startsWith('/tools')) return 'tools';
    if (path.startsWith('/calendar')) return 'calendar';
    if (path.startsWith('/management')) return 'management';
    if (path.startsWith('/community')) return 'community';
    if (path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/inbox')) return 'inbox';
    return null;
  };

  const currentFeature = getCurrentFeature();
  const hasCurrentFeatureAccess = !currentFeature || hasFeatureAccess(currentFeature);

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
        <main className={`p-6 transition-colors duration-300 ${hasModalOpen ? 'bg-black/50' : ''}`}>
          <div className="max-w-7xl mx-auto">
            {hasCurrentFeatureAccess ? (
              <Outlet />
            ) : (
              <UpgradeModal />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;