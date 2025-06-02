import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Button from '../components/Button';

const Insiders = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Insider List</h1>
        <Button onClick={() => navigate('/insiders/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Insider
        </Button>
      </div>

      {/* Placeholder for insider list table */}
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No insiders added yet</p>
      </div>
    </div>
  );
};

export default Insiders;