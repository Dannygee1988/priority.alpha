import React, { useState } from 'react';
import { Building2, Globe } from 'lucide-react';
import Input from '../components/Input';

const Onboarding: React.FC = () => {
  const [companyType, setCompanyType] = useState<'uk' | 'non-uk' | null>(null);
  const [companyName, setCompanyName] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="max-w-4xl w-full p-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Company Location
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setCompanyType('uk')}
                  className={`flex items-center justify-center gap-2 px-6 py-4 border-2 rounded-lg transition-all ${
                    companyType === 'uk'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Globe size={20} />
                  <span className="font-medium">UK Company</span>
                </button>
                <button
                  onClick={() => setCompanyType('non-uk')}
                  className={`flex items-center justify-center gap-2 px-6 py-4 border-2 rounded-lg transition-all ${
                    companyType === 'non-uk'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Globe size={20} />
                  <span className="font-medium">Non-UK Company</span>
                </button>
              </div>
            </div>

            <Input
              type="text"
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter your company name"
              fullWidth
              leftIcon={<Building2 size={18} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
