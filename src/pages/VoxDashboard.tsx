import React from 'react';
import { useAuth } from '../context/AuthContext';

const VoxDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 mb-8">Vox Dashboard</h1>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-12 text-center">
          <p className="text-neutral-600">Dashboard content coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default VoxDashboard;
