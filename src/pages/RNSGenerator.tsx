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
    if (!assistantId || !subject || !description) {
      setError('Please provide all required information.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    // Rest of the generation logic will go here
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded-md ${
              activeTab === 'input'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => setActiveTab('input')}
          >
            Input
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              activeTab === 'output'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => setActiveTab('output')}
          >
            Output
          </button>
        </div>

        {activeTab === 'input' ? (
          <div className="space-y-4">
            <Input
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter the subject of your RNS"
              required
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter a detailed description"
                required
              />
            </div>
            <Input
              label="Keywords (optional)"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter relevant keywords, separated by commas"
            />
            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                'Generating...'
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate RNS
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={generatedContent}
                readOnly
                className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedContent);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
              >
                {isCopied ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RNSGenerator;