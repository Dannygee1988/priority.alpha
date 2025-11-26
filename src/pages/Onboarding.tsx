import React from 'react';

const Onboarding: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="max-w-4xl w-full p-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-neutral-800">Welcome to Priority</h1>
          <p className="text-neutral-600 mt-2">Let's get you set up</p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
