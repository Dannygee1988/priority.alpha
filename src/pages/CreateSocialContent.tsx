import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Wand2, Copy, Check, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';

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
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [generateImage, setGenerateImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showAdvancedPrompts, setShowAdvancedPrompts] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  const platforms = [
    { 
      id: 'linkedin' as const,
      name: 'LinkedIn',
      color: '#0A66C2',
      maxLength: 3000,
      logo: 'https://res.cloudinary.com/deyzbqzya/image/upload/v1747914532/linkedin_logo_icon_170234_qhsx8u.png'
    },
    { 
      id: 'twitter' as const,
      name: 'X (Twitter)',
      color: '#1DA1F2',
      maxLength: 280,
      logo: 'https://res.cloudinary.com/deyzbqzya/image/upload/v1747914532/twitter_logo_icon_170229_qhsx8u.png'
    },
    { 
      id: 'facebook' as const,
      name: 'Facebook',
      color: '#4267B2',
      maxLength: 63206,
      logo: 'https://res.cloudinary.com/deyzbqzya/image/upload/v1747914532/facebook_logo_icon_170237_qhsx8u.png'
    },
    { 
      id: 'instagram' as const,
      name: 'Instagram',
      color: '#E4405F',
      maxLength: 2200,
      logo: 'https://res.cloudinary.com/deyzbqzya/image/upload/v1747914532/instagram_logo_icon_170235_qhsx8u.png'
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
    setGeneratedImageUrl(null);

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
          maxLength: platforms.find(p => p.id === selectedPlatform)?.maxLength,
          generateImage: generateImage,
          customPrompt: showAdvancedPrompts ? customPrompt : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedContent(data.output || data.content || '');
      if (generateImage && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
      }
      setActiveTab('output');
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

  const getPreviewContent = (content: string, maxLength: number = 300) => {
    const lines = content.split('\n').filter(line => line.trim());
    let preview = lines.slice(0, 3).join('\n');
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength) + '...';
    } else if (lines.length > 3) {
      preview += '\n...';
    }
    return preview;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Create Social Media Content</h1>
        <p className="text-neutral-500">Transform your RNS into engaging social media posts</p>
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
              <h2 className="text-lg font-semibold text-neutral-800 mb-4">Original RNS Content</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-neutral-700">{document?.title}</h3>
                  <p className="text-sm text-neutral-500">
                    Published {new Date(document?.published_at || '').toLocaleDateString()}
                  </p>
                </div>
                <div className="prose prose-neutral max-w-none">
                  <div className="bg-neutral-50 rounded-lg p-4 mb-8">
                    <p className="text-neutral-600 whitespace-pre-wrap">
                      {showFullContent ? document?.content : getPreviewContent(document?.content || '')}
                    </p>
                    <button
                      onClick={() => setShowFullContent(!showFullContent)}
                      className="mt-2 flex items-center text-primary hover:text-primary-700 text-sm font-medium"
                    >
                      {showFullContent ? (
                        <>
                          Show less <ChevronUp size={16} className="ml-1" />
                        </>
                      ) : (
                        <>
                          Show more <ChevronDown size={16} className="ml-1" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mb-6 mt-8">
                  <h3 className="text-sm font-medium text-neutral-700 mb-4">Select Platform</h3>
                  <div className="flex justify-center space-x-8">
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform.id)}
                        className="group relative"
                      >
                        <div className={`
                          w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-200
                          ${selectedPlatform === platform.id ? 'ring-4 ring-offset-2' : 'opacity-50 hover:opacity-75'}
                        `}
                        style={{ 
                          backgroundColor: platform.color,
                          ringColor: platform.color
                        }}
                        >
                          <img
                            src={platform.logo}
                            alt={platform.name}
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                        <div className={`
                          absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap
                          text-xs font-medium transition-colors
                          ${selectedPlatform === platform.id ? 'text-neutral-900' : 'text-neutral-500'}
                        `}>
                          {platform.name}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="mt-8 text-sm text-center text-neutral-500">
                    Maximum length: {platforms.find(p => p.id === selectedPlatform)?.maxLength} characters
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={generateImage}
                        onChange={(e) => setGenerateImage(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`block w-14 h-8 rounded-full transition-colors ${
                        generateImage ? 'bg-primary' : 'bg-neutral-200'
                      }`}>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform transform ${
                          generateImage ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-neutral-700">Generate social media image</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={showAdvancedPrompts}
                        onChange={(e) => setShowAdvancedPrompts(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`block w-14 h-8 rounded-full transition-colors ${
                        showAdvancedPrompts ? 'bg-primary' : 'bg-neutral-200'
                      }`}>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform transform ${
                          showAdvancedPrompts ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-neutral-700">Advanced AI prompting</span>
                  </label>

                  {showAdvancedPrompts && (
                    <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                      <div className="flex items-start mb-3">
                        <MessageSquare size={18} className="text-primary mt-1 mr-2" />
                        <p className="text-sm text-neutral-600">
                          Provide additional instructions to guide the AI in creating your social media content.
                          You can specify tone, style, key points to emphasize, or any other preferences.
                        </p>
                      </div>
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Example: Make it more conversational and focus on the growth metrics. Add relevant industry hashtags."
                        className="w-full h-32 px-4 py-2 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary resize-none text-sm"
                      />
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-error-50 text-error-700 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex justify-center">
                  <Button
                    onClick={generateContent}
                    isLoading={isGenerating}
                    leftIcon={<Wand2 size={18} />}
                    className="w-48"
                  >
                    Create Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={activeTab === 'output' ? 'block' : 'hidden'}>
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-neutral-800">Generated Post</h2>
              <p className="text-sm text-neutral-500">
                Your AI-generated social media post for {platforms.find(p => p.id === selectedPlatform)?.name}
              </p>
            </div>

            {isGenerating ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-neutral-600">Generating your social media post...</p>
                  <p className="text-sm text-neutral-500 mt-2">This may take a few moments</p>
                </div>
              </div>
            ) : generatedContent ? (
              <div>
                <div className="relative">
                  <textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    className="w-full h-[300px] p-4 border border-neutral-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  />
                  
                  <div className="mt-2 flex items-center justify-between text-sm text-neutral-500">
                    <span>
                      {generatedContent.length} / {platforms.find(p => p.id === selectedPlatform)?.maxLength} characters
                    </span>
                  </div>
                </div>

                {generatedImageUrl && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-neutral-700 mb-2">Generated Image</h3>
                    <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-neutral-100">
                      <img
                        src={generatedImageUrl}
                        alt="Generated social media image"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('input')}
                  >
                    Back to Input
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    leftIcon={isCopied ? <Check size={18} /> : <Copy size={18} />}
                    className={isCopied ? 'text-success-600 border-success-600' : ''}
                  >
                    {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                  <Button
                    onClick={generateContent}
                    leftIcon={<Wand2 size={18} />}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-500 text-sm italic mb-4">
                  Generated content will appear here...
                </p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('input')}
                >
                  Go to Input
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSocialContent;