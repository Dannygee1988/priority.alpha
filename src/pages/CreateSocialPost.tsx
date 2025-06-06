import React, { useState } from 'react';
import { Twitter, Facebook, Linkedin as LinkedIn, Instagram, Plus, X, Wand2, Image, Hash, Type, MessageSquare, Target, Users, TrendingUp, Copy, Check, RefreshCw } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';

interface Platform {
  id: 'twitter' | 'facebook' | 'linkedin' | 'instagram';
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  hoverColor: string;
  maxLength: number;
  features: string[];
}

interface PostVariable {
  id: string;
  name: string;
  value: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
}

interface GeneratedPost {
  platform: string;
  content: string;
  hashtags?: string[];
  characterCount: number;
}

const CreateSocialPost: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [postType, setPostType] = useState<string>('');
  const [tone, setTone] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [variables, setVariables] = useState<PostVariable[]>([]);
  const [newVariableName, setNewVariableName] = useState('');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [includeCallToAction, setIncludeCallToAction] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const platforms: Platform[] = [
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'bg-[#1DA1F2]',
      hoverColor: 'hover:bg-[#1a94e4]',
      maxLength: 280,
      features: ['Hashtags', 'Mentions', 'Threads']
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#4267B2]',
      hoverColor: 'hover:bg-[#385796]',
      maxLength: 63206,
      features: ['Long-form', 'Events', 'Groups']
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: LinkedIn,
      color: 'bg-[#0A66C2]',
      hoverColor: 'hover:bg-[#0958a3]',
      maxLength: 3000,
      features: ['Professional', 'Articles', 'Industry']
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737]',
      hoverColor: 'hover:opacity-90',
      maxLength: 2200,
      features: ['Visual', 'Stories', 'Reels']
    }
  ];

  const postTypes = [
    'Product Announcement',
    'Company Update',
    'Industry News',
    'Behind the Scenes',
    'Educational Content',
    'User Generated Content',
    'Event Promotion',
    'Thought Leadership',
    'Customer Success Story',
    'Seasonal/Holiday',
    'Custom'
  ];

  const tones = [
    'Professional',
    'Casual',
    'Friendly',
    'Authoritative',
    'Humorous',
    'Inspirational',
    'Educational',
    'Conversational',
    'Urgent',
    'Celebratory'
  ];

  const audiences = [
    'General Public',
    'Industry Professionals',
    'Existing Customers',
    'Potential Customers',
    'Investors',
    'Employees',
    'Partners',
    'Media',
    'Young Adults (18-25)',
    'Professionals (26-45)',
    'Senior Executives'
  ];

  const selectPlatform = (platformId: string) => {
    setSelectedPlatform(platformId);
  };

  const addVariable = () => {
    if (newVariableName.trim()) {
      const newVariable: PostVariable = {
        id: Date.now().toString(),
        name: newVariableName.trim(),
        value: '',
        type: 'text'
      };
      setVariables([...variables, newVariable]);
      setNewVariableName('');
    }
  };

  const updateVariable = (id: string, field: keyof PostVariable, value: any) => {
    setVariables(prev =>
      prev.map(variable =>
        variable.id === id ? { ...variable, [field]: value } : variable
      )
    );
  };

  const removeVariable = (id: string) => {
    setVariables(prev => prev.filter(variable => variable.id !== id));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate API call - replace with actual implementation later
    setTimeout(() => {
      const platform = platforms.find(p => p.id === selectedPlatform);
      const mockContent = generateMockContent(selectedPlatform, platform?.maxLength || 280);
      
      const mockPost: GeneratedPost = {
        platform: platform?.name || selectedPlatform,
        content: mockContent,
        hashtags: includeHashtags ? ['#business', '#innovation', '#growth'] : undefined,
        characterCount: mockContent.length
      };
      
      setGeneratedPost(mockPost);
      setIsGenerating(false);
      setActiveTab('output');
    }, 2000);
  };

  const generateMockContent = (platformId: string, maxLength: number): string => {
    const baseContent = `🚀 Exciting news! We're thrilled to announce our latest ${postType || 'update'}. This represents a significant milestone in our journey to deliver exceptional value to our customers.

${customPrompt ? `\n${customPrompt.slice(0, 100)}...` : ''}

${includeCallToAction ? '\n👉 Learn more at our website!' : ''}`;

    return baseContent.slice(0, maxLength - (includeHashtags ? 50 : 0));
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getPlatformIcon = (platformName: string) => {
    const platform = platforms.find(p => p.name === platformName);
    return platform?.icon || MessageSquare;
  };

  const getPlatformColor = (platformName: string) => {
    const platform = platforms.find(p => p.name === platformName);
    return platform?.color || 'bg-neutral-500';
  };

  return (
    <div className="px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Create New Post</h1>
        <p className="text-neutral-500">Generate engaging social media content with AI assistance</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {/* Tab Navigation */}
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
              disabled={!generatedPost && !isGenerating}
            >
              Output
            </button>
          </div>

          {/* Input Tab */}
          <div className={activeTab === 'input' ? 'block' : 'hidden'}>
            <div className="p-6 space-y-8">
              {/* Platform Selection */}
              <div>
                <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
                  <Target className="mr-2" size={20} />
                  Select Platform
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {platforms.map((platform) => (
                    <div
                      key={platform.id}
                      onClick={() => selectPlatform(platform.id)}
                      className={`
                        relative cursor-pointer rounded-lg border-2 transition-all duration-200 p-4
                        ${selectedPlatform === platform.id
                          ? 'border-primary bg-primary/5'
                          : 'border-neutral-200 hover:border-neutral-300'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-12 h-12 rounded-lg ${platform.color} ${platform.hoverColor} flex items-center justify-center text-white mb-3 transition-colors`}>
                          <platform.icon size={24} />
                        </div>
                        <h3 className="font-medium text-neutral-800 mb-1">{platform.name}</h3>
                        <p className="text-xs text-neutral-500 mb-2">{platform.maxLength} chars max</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {platform.features.slice(0, 2).map((feature) => (
                            <span key={feature} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      {selectedPlatform === platform.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Post Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Post Type
                  </label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select post type...</option>
                    {postTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select tone...</option>
                    {tones.map((toneOption) => (
                      <option key={toneOption} value={toneOption}>{toneOption}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Target Audience
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select audience...</option>
                    {audiences.map((audience) => (
                      <option key={audience} value={audience}>{audience}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content Options */}
              <div>
                <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
                  <Type className="mr-2" size={20} />
                  Content Options
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={includeHashtags}
                      onChange={(e) => setIncludeHashtags(e.target.checked)}
                      className="w-5 h-5 text-primary border-neutral-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <div className="flex items-center">
                      <Hash size={18} className="mr-2 text-primary" />
                      <span className="text-sm font-medium text-neutral-700">Include Hashtags</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={includeEmojis}
                      onChange={(e) => setIncludeEmojis(e.target.checked)}
                      className="w-5 h-5 text-primary border-neutral-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <div className="flex items-center">
                      <span className="mr-2 text-lg">😊</span>
                      <span className="text-sm font-medium text-neutral-700">Include Emojis</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={includeCallToAction}
                      onChange={(e) => setIncludeCallToAction(e.target.checked)}
                      className="w-5 h-5 text-primary border-neutral-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <div className="flex items-center">
                      <TrendingUp size={18} className="mr-2 text-primary" />
                      <span className="text-sm font-medium text-neutral-700">Call to Action</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Custom Variables */}
              <div>
                <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
                  <MessageSquare className="mr-2" size={20} />
                  Custom Variables
                </h2>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Variable name (e.g., product_name, event_date)"
                      value={newVariableName}
                      onChange={(e) => setNewVariableName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addVariable();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={addVariable}
                      disabled={!newVariableName.trim()}
                      leftIcon={<Plus size={18} />}
                    >
                      Add
                    </Button>
                  </div>

                  {variables.length > 0 && (
                    <div className="space-y-3">
                      {variables.map((variable) => (
                        <div key={variable.id} className="flex items-center space-x-4 p-4 bg-neutral-50 rounded-lg">
                          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2">
                              <label className="block text-xs font-medium text-neutral-600 mb-1">
                                {variable.name}
                              </label>
                              <input
                                type="text"
                                value={variable.value}
                                onChange={(e) => updateVariable(variable.id, 'value', e.target.value)}
                                placeholder={`Enter ${variable.name}`}
                                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-neutral-600 mb-1">
                                Type
                              </label>
                              <select
                                value={variable.type}
                                onChange={(e) => updateVariable(variable.id, 'type', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                              >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                              </select>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariable(variable.id)}
                            className="text-error-600 hover:text-error-700 flex-shrink-0"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
                  <Wand2 className="mr-2" size={20} />
                  Additional Instructions
                </h2>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Provide any additional context, specific requirements, or instructions for the AI to consider when generating your post..."
                  className="w-full h-32 px-4 py-3 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
                <p className="mt-2 text-sm text-neutral-500">
                  The AI will use your company data along with these instructions to create personalized content.
                </p>
              </div>

              {/* Generate Button */}
              <div className="pt-6 border-t border-neutral-200">
                <div className="flex justify-center">
                  <Button
                    onClick={handleGenerate}
                    size="lg"
                    leftIcon={<Wand2 size={20} />}
                    disabled={!selectedPlatform}
                    isLoading={isGenerating}
                    className="w-64"
                  >
                    {isGenerating ? 'Generating Post...' : 'Generate Post'}
                  </Button>
                </div>
                {!selectedPlatform && (
                  <p className="text-center text-sm text-error-600 mt-2">
                    Please select a platform to continue
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Output Tab */}
          <div className={activeTab === 'output' ? 'block' : 'hidden'}>
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-neutral-800">Generated Post</h2>
                <p className="text-sm text-neutral-500">Your AI-generated social media content</p>
              </div>

              {isGenerating ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-neutral-600">Generating your social media post...</p>
                    <p className="text-sm text-neutral-500 mt-2">This may take a few moments</p>
                  </div>
                </div>
              ) : generatedPost ? (
                <div className="space-y-6">
                  <div className="bg-neutral-50 rounded-lg border border-neutral-200 overflow-hidden">
                    <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-lg ${getPlatformColor(generatedPost.platform)} flex items-center justify-center text-white mr-3`}>
                          {React.createElement(getPlatformIcon(generatedPost.platform), { size: 18 })}
                        </div>
                        <div>
                          <h3 className="font-medium text-neutral-800">{generatedPost.platform}</h3>
                          <p className="text-sm text-neutral-500">
                            {generatedPost.characterCount} characters
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedPost.content)}
                          leftIcon={isCopied ? <Check size={16} /> : <Copy size={16} />}
                          className={isCopied ? 'text-success-600 border-success-600' : ''}
                        >
                          {isCopied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="bg-white rounded-lg p-4 border border-neutral-200">
                        <p className="whitespace-pre-wrap text-neutral-700 leading-relaxed">
                          {generatedPost.content}
                        </p>
                        {generatedPost.hashtags && generatedPost.hashtags.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-neutral-200">
                            <div className="flex flex-wrap gap-2">
                              {generatedPost.hashtags.map((hashtag, hashIndex) => (
                                <span
                                  key={hashIndex}
                                  className="text-primary font-medium text-sm"
                                >
                                  {hashtag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-3 pt-6 border-t border-neutral-200">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('input')}
                    >
                      Back to Input
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      leftIcon={<RefreshCw size={18} />}
                    >
                      Regenerate Post
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-neutral-500 text-sm italic mb-4">
                    Generated post will appear here...
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
    </div>
  );
};

export default CreateSocialPost;