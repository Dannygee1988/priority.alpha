import React, { useState, useEffect } from 'react';
import { Wand2, Copy, CheckCircle, Check } from 'lucide-react';
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
  const [rnsType, setRnsType] = useState<'RNS' | 'RNS Reach'>('RNS');
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [isApproved, setIsApproved] = useState(false);

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
    if (!subject.trim() || !description.trim()) {
      setError('Please fill in both subject and description fields.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedContent('');

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
          assistant_id: assistantId,
          rns_type: rnsType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      let content = data.output || data.content || '';
      
      const endIndex = content.indexOf('---\n\nEND');
      if (endIndex !== -1) {
        content = content.substring(0, endIndex + 9);
      }
      
      setGeneratedContent(content);
      setEditableContent(content);
      setIsApproved(false);
      setActiveTab('output');
    } catch (err) {
      console.error('Error generating RNS:', err);
      setError('Failed to generate RNS content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const contentToCopy = isEditing ? editableContent : generatedContent;
      await navigator.clipboard.writeText(contentToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditableContent(generatedContent);
  };

  const handleSaveEdit = () => {
    setGeneratedContent(editableContent);
    setIsEditing(false);
    setIsApproved(false);
  };

  const handleCancelEdit = () => {
    setEditableContent(generatedContent);
    setIsEditing(false);
  };

  const handleSaveDraft = async () => {
    if (!user?.id || !generatedContent) return;

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        setError('No company found for user');
        return;
      }

      const { data, error: insertError } = await supabase
        .from('rns_documents')
        .insert({
          company_id: companyId,
          title: subject,
          content: generatedContent,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setIsApproved(true);
      setTimeout(() => {
        setIsApproved(false);
      }, 2000);

    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Failed to save draft. Please try again.');
    }
  };

  const renderMarkdown = (content: string) => {
    return content
      .replace(/^RNS Number: (.+)$/gm, '<div class="text-sm text-neutral-600 mb-2"><strong>RNS Number:</strong> $1</div>')
      .replace(/^([A-Z][A-Z\s&]+PLC)$/gm, '<h1 class="text-xl font-bold text-primary mb-2">$1</h1>')
      .replace(/^([A-Z\s:]+)$/gm, '<h2 class="text-lg font-bold text-neutral-800 mb-4 mt-6">$2</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-neutral-800 mb-3 mt-5">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-neutral-800 mb-4 mt-6">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-neutral-800 mb-6 mt-8">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      .replace(/_\"([^"]+)\"_/g, '<em class="italic text-neutral-700">"$1"</em>')
      .replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 list-disc">$1</li>')
      .replace(/^---$/gm, '<hr class="my-6 border-neutral-300">')
      .replace(/^([A-Z][a-zA-Z\s&()]+)$/gm, '<div class="font-semibold text-neutral-800 mt-4 mb-1">$1</div>')
      .replace(/^(\+\d{2}\s\(\d\)\s\d{2}\s\d{4}\s\d{4})$/gm, '<div class="text-neutral-600 mb-1">$1</div>')
      .replace(/^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/gm, '<div class="text-primary hover:underline mb-1"><a href="mailto:$1">$1</a></div>')
      .replace(/^(www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/gm, '<div class="text-primary hover:underline mb-2"><a href="https://$1" target="_blank">$1</a></div>')
      .split('\n\n')
      .map(paragraph => {
        if (paragraph.trim() === '') return '';
        if (paragraph.includes('<h1>') || paragraph.includes('<h2>') || paragraph.includes('<hr>') || paragraph.includes('<div class="font-semibold">')) {
          return paragraph;
        }
        return `<p class="mb-4 leading-relaxed">${paragraph}</p>`;
      })
      .join('')
      .replace(/<p class="mb-4 leading-relaxed"><\/p>/g, '')
      .replace(/<p class="mb-4 leading-relaxed">(<h[1-6]|<hr|<div)/g, '$1')
      .replace(/(<\/h[1-6]>|<\/hr>|<\/div>)<\/p>/g, '$1');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">RNS Generator</h1>
        <p className="text-neutral-500">Create professional Regulatory News Service announcements with AI assistance</p>
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
            disabled={!generatedContent && !isGenerating}
          >
            Output
          </button>
        </div>

        <div className={activeTab === 'input' ? 'block' : 'hidden'}>
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-neutral-800 mb-4">Announcement Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-neutral-700 text-sm font-medium mb-1">
                    RNS Type <span className="text-error-500">*</span>
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                        rnsType === 'RNS'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                      }`}
                      onClick={() => setRnsType('RNS')}
                    >
                      RNS
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                        rnsType === 'RNS Reach'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                      }`}
                      onClick={() => setRnsType('RNS Reach')}
                    >
                      RNS Reach
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">
                    Select the type of regulatory announcement
                  </p>
                </div>

                <Input
                  label="Subject"
                  placeholder="Enter the subject of your announcement"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  fullWidth
                  required
                />
                <div>
                  <label className="block text-neutral-700 text-sm font-medium mb-1">
                    Description <span className="text-error-500">*</span>
                  </label>
                  <textarea
                    className="w-full h-40 px-4 py-2 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                    placeholder="Describe what you're announcing (product launch, partnership, milestone, etc.)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
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
              disabled={!subject.trim() || !description.trim()}
            >
              {isGenerating ? 'Generating RNS Announcement...' : 'Generate RNS Announcement'}
            </Button>
          </div>
        </div>

        <div className={activeTab === 'output' ? 'block' : 'hidden'}>
          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-neutral-800">Generated Announcement</h2>
                <p className="text-sm text-neutral-500">Your AI-generated RNS announcement</p>
              </div>
              {generatedContent && (
                <div className="flex space-x-2">
                  {!isEditing && (
                    <Button
                      onClick={handleEdit}
                      variant="outline"
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    onClick={handleCopyToClipboard}
                    variant="outline"
                    leftIcon={isCopied ? <CheckCircle size={18} /> : <Copy size={18} />}
                    className={isCopied ? 'text-success-600 border-success-600' : ''}
                  >
                    {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 min-h-[500px]">
              {isGenerating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-neutral-600">Generating your RNS announcement...</p>
                    <p className="text-sm text-neutral-500 mt-2">This may take a few moments</p>
                  </div>
                </div>
              ) : generatedContent ? (
                isEditing ? (
                  <div>
                    <textarea
                      value={editableContent}
                      onChange={(e) => setEditableContent(e.target.value)}
                      className="w-full h-[500px] p-4 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary resize-none font-mono text-sm"
                      placeholder="Edit your RNS content..."
                    />
                    <div className="mt-4 flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveEdit}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: renderMarkdown(generatedContent) 
                    }}
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-neutral-500 text-sm italic mb-4">
                      Generated content will appear here ..
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('input')}
                    >
                      Go to Input
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {generatedContent && !isEditing && (
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={handleSaveDraft}
                  size="md"
                  leftIcon={isApproved ? <CheckCircle size={18} /> : <Check size={18} />}
                  className={`w-64 ${isApproved ? 'bg-success-600 hover:bg-success-700 text-white' : ''}`}
                  disabled={isApproved}
                >
                  {isApproved ? 'Draft Saved' : 'Save Draft'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RNSGenerator;