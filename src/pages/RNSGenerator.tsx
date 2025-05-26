import React, { useState, useEffect } from 'react';
import { Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

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
    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const response = await fetch('https://pri0r1ty.app.n8n.cloud/webhook/25e0d499-6af1-4357-8c23-a1b43d7bedb8', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          description,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          assistant_id: assistantId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate RNS');
      }

      const data = await response.json();
      setGeneratedContent(data.content || 'No content received');
      setActiveTab('output');
    } catch (error) {
      console.error('Error generating RNS:', error);
      setGeneratedContent('Failed to generate RNS. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
                  label="Subject"
                  placeholder="Enter the subject of your announcement"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  fullWidth
                />
                <div>
                  <label className="block text-neutral-700 text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full h-40 px-4 py-2 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                    placeholder="Describe what you're announcing (product launch, partnership, milestone, etc.)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    fullWidth
                  />
                  <p className="mt-1 text-sm text-neutral-500">
                    Keywords to emphasize in the press release
                  </p>
                </div>
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
              <p className="text-sm text-neutral-500">Your AI-generated RNS announcement</p>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 min-h-[500px]">
              {isGenerating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : generatedContent ? (
                <div className="prose max-w-none">
                  <ReactMarkdown>{generatedContent}</ReactMarkdown>
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
                onClick={() => {
                  if (generatedContent) {
                    navigator.clipboard.writeText(generatedContent);
                  }
                }}
                disabled={!generatedContent}
              >
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