import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Twitter, Facebook, Linkedin, Instagram, Copy, Check, RefreshCw } from 'lucide-react';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';

interface RNSDocument {
  id: string;
  title: string;
  content: string;
  type: string;
  published_at: string;
}

interface SocialPost {
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram';
  content: string;
}

const CreateSocialContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [document, setDocument] = useState<RNSDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPost['platform']>('linkedin');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const platforms = [
    { 
      id: 'linkedin' as const, 
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-[#0077B5]',
      hoverColor: 'hover:bg-[#006399]',
      maxLength: 3000
    },
    { 
      id: 'twitter' as const, 
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'bg-[#1DA1F2]',
      hoverColor: 'hover:bg-[#1a94e4]',
      maxLength: 280
    },
    { 
      id: 'facebook' as const, 
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#4267B2]',
      hoverColor: 'hover:bg-[#385796]',
      maxLength: 63206
    },
    { 
      id: 'instagram' as const, 
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737]',
      hoverColor: 'hover:opacity-90',
      maxLength: 2200
    }
  ];

  useEffect(() => {
    fetchDocument();
  }, [id, user]);

  const fetchDocument = async () => {
    if (!id || !user?.id) return;

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      const { data, error: fetchError } = await supabase
        .from('rns_documents')
        .select('*')
        .eq('id', id)
        .eq('company_id', companyId)
        .single();

      if (fetchError) throw fetchError;
      setDocument(data);
    } catch (err) {
      console.error('Error fetching document:', err);
      setError('Failed to load document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateContent = async () => {
    if (!document) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('https://pri0r1ty.app.n8n.cloud/webhook/25e0d499-6af1-4357-8c23-a1b43d7bedb8', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: document.content,
          platform: selectedPlatform,
          type: document.type,
          title: document.title,
          maxLength: platforms.find(p => p.id === selectedPlatform)?.maxLength
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedContent(data.output || data.content || '');
    } catch (err) {
      console.error('Error generating content:', err);
      setError('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-8">
        <div className="bg-error-50 text-error-700 p-4 rounded-lg">
          Document not found or access denied.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Create Social Media Content</h1>
        <p className="text-neutral-500">Transform your RNS into engaging social media posts</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Original RNS Content */}
        <div className="col-span-6">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">Original RNS</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-neutral-700">{document.title}</h3>
                <p className="text-sm text-neutral-500">
                  Published {new Date(document.published_at).toLocaleDateString()}
                </p>
              </div>
              <div className="prose prose-neutral max-w-none">
                <div className="bg-neutral-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                  {document.content}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Content */}
        <div className="col-span-6">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-neutral-800 mb-4">Social Media Post</h2>
              
              <div className="flex space-x-2 mb-6">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`
                      flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${selectedPlatform === platform.id
                        ? `${platform.color} text-white`
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }
                    `}
                  >
                    <platform.icon size={18} className="mr-2" />
                    {platform.name}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-4 p-4 bg-error-50 text-error-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="relative">
                <textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  className="w-full h-[400px] p-4 border border-neutral-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Generated content will appear here..."
                />
                
                <div className="absolute bottom-4 right-4 flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    leftIcon={isCopied ? <Check size={16} /> : <Copy size={16} />}
                    className={isCopied ? 'text-success-600 border-success-600' : ''}
                  >
                    {isCopied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={generateContent}
                    isLoading={isGenerating}
                    leftIcon={<RefreshCw size={16} />}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>

              {selectedPlatform && (
                <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
                  <span>
                    Platform: {platforms.find(p => p.id === selectedPlatform)?.name}
                  </span>
                  <span>
                    {generatedContent.length} / {platforms.find(p => p.id === selectedPlatform)?.maxLength} characters
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSocialContent;