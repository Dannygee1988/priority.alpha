import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import Button from '../components/Button';

const ImproveRNS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [isGenerating, setIsGenerating] = useState(false);

  const improvementOptions = [
    {
      id: 'compliance',
      title: 'Compliance & Regulatory Improvements',
      description: 'Systematically review the draft against UK Listing Rules, FCA requirements, and Market Abuse Regulation standards. Cross-reference mandatory disclosure requirements with the company\'s sector and listing status. Identify any missing regulatory language or improperly categorized information. Strengthen risk warnings and forward-looking statement disclaimers where necessary.'
    },
    {
      id: 'accuracy',
      title: 'Content Quality & Accuracy Improvements',
      description: 'Verify all factual statements against available company records and public information. Check mathematical calculations and ensure consistency across all numerical references. Validate proper use of legal entity names, subsidiary relationships, and technical terminology specific to the company\'s sector.'
    },
    {
      id: 'communication',
      title: 'Investor Communication Improvements',
      description: 'Strengthen clarity and readability while preserving technical accuracy. Enhance the strategic context and business implications of announcements. Improve the executive summary and key highlights for maximum investor impact. Ensure messaging resonates with the intended stakeholder audience.'
    },
    {
      id: 'presentation',
      title: 'Professional Presentation Improvements',
      description: 'Elevate the professional quality of language and structure. Optimize paragraph flow and logical progression. Strengthen headlines and executive quotes for authenticity and impact. Ensure consistency with the company\'s established communication voice and branding.'
    },
    {
      id: 'formatting',
      title: 'Technical Formatting Improvements',
      description: 'Verify all structural elements conform to standard RNS requirements. Check contact information accuracy and completeness. Validate proper numbering, dating, and referencing throughout the document. Optimize table and data presentation for clarity and professional appearance.'
    },
    {
      id: 'engagement',
      title: 'Engagement & Impact Improvements',
      description: 'Enhance investor appeal while maintaining full regulatory compliance. Amplify key messages for maximum impact without overstating facts. Improve timing relevance and materiality presentation. Optimize content for potential media coverage and broader stakeholder understanding.'
    }
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
                  <label className="block text-neutral-700 text-sm font-medium mb-3">
                    Improvement preferences
                  </label>
                  <div className="space-y-3 max-w-[50%]">
                    {improvementOptions.map((option) => (
                      <div
                        key={option.id}
                        className="group relative flex items-center"
                      >
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="form-checkbox text-primary rounded"
                          />
                          <span className="ml-2 text-sm text-neutral-700">{option.title}</span>
                        </label>
                        <div className="fixed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-neutral-800 text-white text-xs rounded-lg shadow-lg z-10 p-3 max-w-[300px] ml-4 left-[calc(50%+150px)]">
                          {option.description}
                          <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-neutral-800 transform rotate-45"></div>
                        </div>
                      </div>
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