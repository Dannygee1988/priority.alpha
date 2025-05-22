import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';

const RNSGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [includeAdditional, setIncludeAdditional] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      setActiveTab('output');
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">RNS Generator</h1>
        <p className="text-neutral-500">Create professional Regulatory News Service announcements with AI assistance</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        {/* Tabs */}
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

        {/* Input Section */}
        <div className={activeTab === 'input' ? 'block' : 'hidden'}>
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-neutral-800 mb-4">Announcement Details</h2>
              <div className="space-y-4">
                <Input
                  label="Title"
                  placeholder="Enter the title of your announcement"
                  fullWidth
                />
                <div>
                  <label className="block text-neutral-700 text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full h-40 px-4 py-2 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                    placeholder="Describe what you're announcing (product launch, partnership, milestone, etc.)"
                  />
                  <p className="mt-1 text-sm text-neutral-500">
                    Provide detailed information about your announcement for the press release
                  </p>
                </div>
                <div>
                  <label className="block text-neutral-700 text-sm font-medium mb-1">
                    Keywords <span className="text-neutral-500">(optional)</span>
                  </label>
                  <Input
                    placeholder="Enter keywords separated by commas"
                    fullWidth
                  />
                  <p className="mt-1 text-sm text-neutral-500">
                    Keywords to emphasize in the press release
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="additional-info"
                  checked={includeAdditional}
                  onChange={(e) => setIncludeAdditional(e.target.checked)}
                  className="h-4 w-4 text-primary border-neutral-300 rounded focus:ring-primary"
                />
                <label htmlFor="additional-info" className="ml-2 block text-sm text-neutral-700">
                  Include Additional Information
                </label>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              isLoading={isGenerating}
              leftIcon={<Wand2 size={18} />}
              fullWidth
            >
              Generate RNS Announcement
            </Button>
          </div>
        </div>

        {/* Output Section */}
        <div className={activeTab === 'output' ? 'block' : 'hidden'}>
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-neutral-800">Generated Announcement</h2>
              <p className="text-sm text-neutral-500">Your AI-generated RNS announcement will appear here</p>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 min-h-[500px]">
              <p className="text-neutral-500 text-sm italic">
                Generated content will appear here...
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setActiveTab('input')}
                className="mr-2"
              >
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

export default RNSGenerator;