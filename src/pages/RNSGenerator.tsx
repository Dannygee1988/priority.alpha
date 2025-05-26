import React, { useState, useEffect } from 'react';
import { Wand2, Copy, CheckCircle } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';

const RNSGenerator: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [isGenerating, setIsGenerating] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchAssistantId = async () => {
      if (!user?.id) return;

      try {
        const companyId = await getUserCompany(user.id);
        if (!companyId) return;

        const { data, error } = await supabase
          .from('company_profiles')
          .select('assistant_id')
          .eq('id', companyId)
          .single();

        if (error) throw error;
        setAssistantId(data?.assistant_id);
      } catch (err) {
        console.error('Error fetching assistant ID:', err);
      }
    };

    fetchAssistantId();
  }, [user]);

  const handleGenerate = async () => {
    if (!subject || !description || !assistantId) {
      setError('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGeneratedContent('Sample generated content will appear here...');
      setActiveTab('output');
    } catch (err) {
      console.error('Error generating RNS:', err);
      setError('Failed to generate RNS. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter the title of your announcement"
                  fullWidth
                />
                <div>
                  <label className="block text-neutral-700 text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Enter keywords separated by commas"
                    fullWidth
                  />
                  <p className="mt-1 text-sm text-neutral-500">
                    Keywords to emphasize in the press release
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-error-50 text-error-700 rounded-md">
                {error}
              </div>
            )}

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
              <p className="text-sm text-neutral-500">Your AI-generated RNS announcement</p>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 min-h-[500px]">
              {generatedContent ? (
                <div className="prose max-w-none">
                  {generatedContent}
                </div>
              ) : (
                <p className="text-neutral-500 text-sm italic">
                  Generated content will appear here...
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setActiveTab('input')}
              >
                Edit Input
              </Button>
              <Button
                onClick={handleCopy}
                leftIcon={isCopied ? <CheckCircle size={18} /> : <Copy size={18} />}
              >
                {isCopied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RNSGenerator;