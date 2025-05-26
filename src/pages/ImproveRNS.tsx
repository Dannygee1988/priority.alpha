import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import Button from '../components/Button';

const ImproveRNS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [isGenerating, setIsGenerating] = useState(false);

  const improvementOptions = [
    { id: 'compliance', title: 'Compliance & Regulatory' },
    { id: 'accuracy', title: 'Content Quality & Accuracy' },
    { id: 'communication', title: 'Investor Communication' },
    { id: 'presentation', title: 'Professional Presentation' },
    { id: 'formatting', title: 'Technical Formatting' },
    { id: 'engagement', title: 'Engagement & Impact' }
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setActiveTab('output');
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Improve RNS</h1>
        <p className="text-neutral-500">Enhance your existing RNS announcements with AI optimization</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="flex border-b border-neutral-200">
          <button
            className={`flex-1 px-6 py-3 text-sm font-medium focus:outline-none ${
              activeTab === 'input'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-neutral-600 hover:text-primary hover:bg-primary/5'
            }`}
            onClick={() => setActiveTab('input')}
          >
            Input
          </button>
          <button
            className={`flex-1 px-6 py-3 text-sm font-medium focus:outline-none ${
              activeTab === 'output'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-neutral-600 hover:text-primary hover:bg-primary/5'
            }`}
            onClick={() => setActiveTab('output')}
          >
            Output
          </button>
        </div>

        <div className={activeTab === 'input' ? 'block' : 'hidden'}>
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-neutral-800 mb-4">Existing RNS Content</h2>
              <div className="space-y-4">
                <div>
                  <textarea
                    className="w-full h-60 px-4 py-2 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                    placeholder="Paste the RNS content you want to improve..."
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-800 mb-4">
                    Improvement Preferences
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {improvementOptions.map((option) => (
                      <label key={option.id} className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-neutral-50">
                        <input
                          type="checkbox"
                          className="form-checkbox text-primary rounded"
                        />
                        <span className="ml-2 text-sm text-neutral-700">{option.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              isLoading={isGenerating}
              leftIcon={<Wand2 size={18} />}
              fullWidth
            >
              Improve RNS Content
            </Button>
          </div>
        </div>

        <div className={activeTab === 'output' ? 'block' : 'hidden'}>
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-neutral-800">Improved Announcement</h2>
              <p className="text-sm text-neutral-500">Your AI-optimized RNS announcement</p>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 min-h-[500px]">
              <p className="text-neutral-500 text-sm italic">
                Optimized content will appear here...
              </p>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setActiveTab('input')}>
                Edit Input
              </Button>
              <Button>
                Copy to Clipboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImproveRNS;