import React, { useState, useEffect } from 'react';
import { Twitter, Facebook, Linkedin as LinkedIn, Instagram, Plus, X, Wand2, Image, Hash, Type, MessageSquare, Target, Users, TrendingUp, Copy, Check, RefreshCw, ChevronDown, Sparkles } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';

interface Platform {
  id: 'twitter' | 'facebook' | 'linkedin' | 'instagram';
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  hoverColor: string;
  maxLength: number;
  features: string[];
}

interface GeneratedPost {
  platform: string;
  content: string;
  hashtags?: string[];
  characterCount: number;
}

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  description: string | null;
  tags: string[];
  created_at: string;
}

const CreateSocialPost: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [postType, setPostType] = useState<string>('');
  const [tone, setTone] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [includeCallToAction, setIncludeCallToAction] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // Image selection states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Hashtag management states
  const [editableHashtags, setEditableHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState('');

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

  useEffect(() => {
    if (activeTab === 'output') {
      loadGalleryImages();
    }
  }, [activeTab, user]);

  // Update editable hashtags when generated post changes
  useEffect(() => {
    if (generatedPost?.hashtags) {
      setEditableHashtags([...generatedPost.hashtags]);
    }
  }, [generatedPost]);

  const loadGalleryImages = async () => {
    if (!user?.id) return;

    setIsLoadingGallery(true);
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) return;

      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setGalleryImages(data || []);
    } catch (err) {
      console.error('Error loading gallery images:', err);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const selectPlatform = (platformId: string) => {
    setSelectedPlatform(platformId);
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

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    // Simulate image generation
    setTimeout(() => {
      // Mock generated image URL
      const mockImageUrl = `https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=400&fit=crop&crop=center`;
      setSelectedImage(mockImageUrl);
      setIsGeneratingImage(false);
    }, 3000);
  };

  const handleAddHashtag = () => {
    if (newHashtag.trim() && !editableHashtags.includes(newHashtag.trim())) {
      const hashtag = newHashtag.trim().startsWith('#') ? newHashtag.trim() : `#${newHashtag.trim()}`;
      setEditableHashtags([...editableHashtags, hashtag]);
      setNewHashtag('');
    }
  };

  const handleRemoveHashtag = (hashtagToRemove: string) => {
    setEditableHashtags(editableHashtags.filter(hashtag => hashtag !== hashtagToRemove));
  };

  const handleHashtagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  return (
    <div className="px-4 py-8 animate-fade-in">
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
                  <div className="relative">
                    <select
                      value={postType}
                      onChange={(e) => setPostType(e.target.value)}
                      className="w-full px-4 py-2 pr-12 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
                    >
                      <option value="">Select post type...</option>
                      {postTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <ChevronDown size={16} className="text-neutral-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tone
                  </label>
                  <div className="relative">
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full px-4 py-2 pr-12 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
                    >
                      <option value="">Select tone...</option>
                      {tones.map((toneOption) => (
                        <option key={toneOption} value={toneOption}>{toneOption}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <ChevronDown size={16} className="text-neutral-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Target Audience
                  </label>
                  <div className="relative">
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full px-4 py-2 pr-12 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
                    >
                      <option value="">Select audience...</option>
                      {audiences.map((audience) => (
                        <option key={audience} value={audience}>{audience}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <ChevronDown size={16} className="text-neutral-400" />
                    </div>
                  </div>
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

              {/* Prompt */}
              <div>
                <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
                  <Wand2 className="mr-2" size={20} />
                  Prompt
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
              {isGenerating ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-neutral-600">Generating your social media post...</p>
                    <p className="text-sm text-neutral-500 mt-2">This may take a few moments</p>
                  </div>
                </div>
              ) : generatedPost ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Generated Post Content */}
                  <div className="lg:col-span-2">
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
                          
                          {/* Interactive Hashtag Array */}
                          {includeHashtags && (
                            <div className="mt-4 pt-4 border-t border-neutral-200">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-medium text-neutral-700 flex items-center">
                                  <Hash size={16} className="mr-1" />
                                  Hashtags
                                </h4>
                                <span className="text-xs text-neutral-500">
                                  {editableHashtags.length} hashtag{editableHashtags.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              
                              {/* Hashtag Display */}
                              <div className="flex flex-wrap gap-2 mb-3">
                                {editableHashtags.map((hashtag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors group"
                                  >
                                    {hashtag}
                                    <button
                                      onClick={() => handleRemoveHashtag(hashtag)}
                                      className="ml-2 hover:text-error-600 transition-colors opacity-0 group-hover:opacity-100"
                                      title="Remove hashtag"
                                    >
                                      <X size={14} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              
                              {/* Add New Hashtag */}
                              <div className="flex space-x-2">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={newHashtag}
                                    onChange={(e) => setNewHashtag(e.target.value)}
                                    onKeyDown={handleHashtagKeyDown}
                                    placeholder="Add hashtag..."
                                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                                <Button
                                  onClick={handleAddHashtag}
                                  size="sm"
                                  disabled={!newHashtag.trim()}
                                  leftIcon={<Plus size={14} />}
                                >
                                  Add
                                </Button>
                              </div>
                              <p className="text-xs text-neutral-500 mt-2">
                                Press Enter or click Add to include a new hashtag
                              </p>
                            </div>
                          )}
                          
                          {/* Selected Image Preview */}
                          {selectedImage && (
                            <div className="mt-4 pt-4 border-t border-neutral-200">
                              <div className="relative">
                                <img
                                  src={selectedImage}
                                  alt="Selected for post"
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                                <button
                                  onClick={() => setSelectedImage(null)}
                                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Selection Panel */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                      <div className="p-4 border-b border-neutral-200">
                        <h3 className="font-medium text-neutral-800 flex items-center">
                          <Image size={18} className="mr-2" />
                          Add Image
                        </h3>
                        <p className="text-sm text-neutral-500 mt-1">
                          Generate or select an image for your post
                        </p>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Generate Image Button */}
                        <Button
                          onClick={handleGenerateImage}
                          isLoading={isGeneratingImage}
                          leftIcon={<Sparkles size={18} />}
                          fullWidth
                          variant="outline"
                        >
                          {isGeneratingImage ? 'Generating...' : 'Generate Image'}
                        </Button>

                        {/* Gallery Section */}
                        <div>
                          <h4 className="text-sm font-medium text-neutral-700 mb-3">
                            Select from Gallery
                          </h4>
                          
                          {isLoadingGallery ? (
                            <div className="flex justify-center items-center h-32">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                          ) : galleryImages.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                              {galleryImages.map((image) => (
                                <div
                                  key={image.id}
                                  onClick={() => setSelectedImage(image.url)}
                                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                    selectedImage === image.url
                                      ? 'border-primary'
                                      : 'border-transparent hover:border-neutral-300'
                                  }`}
                                >
                                  <img
                                    src={image.url}
                                    alt={image.title}
                                    className="w-full h-20 object-cover"
                                  />
                                  {selectedImage === image.url && (
                                    <div className="absolute inset-0 bg-primary bg-opacity-20 flex items-center justify-center">
                                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                        <Check size={14} className="text-white" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-neutral-500">
                              <Image size={32} className="mx-auto mb-2 text-neutral-300" />
                              <p className="text-sm">No images in gallery</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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

              {generatedPost && (
                <div className="flex justify-center space-x-3 pt-6 border-t border-neutral-200 mt-6">
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSocialPost;