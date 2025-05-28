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
  const [projectName, setProjectName] = useState('');
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
  const [isSaving, setIsSaving] = useState(false);

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

  const generateProjectName = () => {
    const adjectives = ['Blue', 'Red', 'Green', 'Silver', 'Gold', 'Crystal', 'Swift', 'Bright', 'Alpha', 'Nova'];
    const nouns = ['Star', 'Moon', 'Sun', 'Sky', 'Ocean', 'Mountain', 'River', 'Forest', 'Peak', 'Valley'];
    const numbers = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

    const randomWord = (array: string[]) => array[Math.floor(Math.random() * array.length)];
    const newProjectName = `${randomWord(adjectives)}.${randomWord(nouns)}.${randomWord(numbers)}`;

    setProjectName(newProjectName);
  };

  const handleGenerate = async () => {
    if (!projectName.trim() || !subject.trim() || !description.trim()) {
      setError('Please fill in all required fields.');
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
          project_name: projectName,
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

    setIsSaving(true);
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        setError('No company found');
        return;
      }

      // First create the market sounding
      const { data: soundingData, error: soundingError } = await supabase
        .from('market_soundings')
        .insert({
          company_id: companyId,
          subject,
          description,
          project_name: projectName,
          status: 'Live'
        })
        .select()
        .single();

      if (soundingError) throw soundingError;

      // Then create the RNS draft
      const { data: rnsData, error: rnsError } = await supabase
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

      if (rnsError) throw rnsError;

      setIsApproved(true);
      setTimeout(() => {
        setIsApproved(false);
      }, 2000);

    } catch (err) {
      console.error('Error saving:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderMarkdown = (content: string) => {
    return content
      .split('\n\n')
      .map((paragraph, index) => {
        // Replace bold text
        const boldText = paragraph
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          // Replace italic text
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          // Replace links
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        return (
          <p
            key={index}
            className="mb-4"
            dangerouslySetInnerHTML={{ __html: boldText }}
          />
        );
      });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'input'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('input')}
          >
            Input
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'output'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('output')}
          >
            Output
          </button>
        </div>

        {activeTab === 'input' ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Input
                label="Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                required
              />
              <Button
                onClick={generateProjectName}
                variant="outline"
                className="mt-6"
              >
                Generate
              </Button>
            </div>

            <div className="space-y-4">
              <Input
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description"
                  required
                />
              </div>

              <Input
                label="Keywords (comma-separated)"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Enter keywords"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RNS Type
                </label>
                <select
                  value={rnsType}
                  onChange={(e) => setRnsType(e.target.value as 'RNS' | 'RNS Reach')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RNS">RNS</option>
                  <option value="RNS Reach">RNS Reach</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center space-x-2"
              >
                <Wand2 className="w-4 h-4" />
                <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            {generatedContent ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Generated Content</h2>
                  <div className="flex space-x-2">
                    {!isEditing ? (
                      <>
                        <Button
                          onClick={handleCopyToClipboard}
                          variant="outline"
                          className="flex items-center space-x-2"
                        >
                          {isCopied ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                        </Button>
                        <Button onClick={handleEdit} variant="outline">
                          Edit
                        </Button>
                        <Button
                          onClick={handleSaveDraft}
                          disabled={isSaving}
                          className="flex items-center space-x-2"
                        >
                          {isApproved ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <span>Save Draft</span>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={handleSaveEdit} variant="outline">
                          Save
                        </Button>
                        <Button onClick={handleCancelEdit} variant="outline">
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="prose max-w-none">
                    {renderMarkdown(generatedContent)}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500">
                No content generated yet. Switch to the Input tab to generate content.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RNSGenerator;