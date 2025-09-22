import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, User, Bot, ChevronDown, ChevronUp, Tag as TagIcon, Lock } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';

interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'bot';
  content: string;
  source: 'website' | 'whatsapp' | 'telegram' | 'facebook' | 'instagram';
  metadata: any;
  created_at: string;
  subject: string;
  sentiment_score: number;
  keywords: string[];
  email: string;
  'Ai response': string | null;
  'Topic': string | null;
}

interface CompanyProfile {
  logo_url: string | null;
}

type Platform = 'all' | 'whatsapp' | 'telegram' | 'facebook' | 'instagram' | 'website';

const platforms: { id: Platform; name: string; emoji: string }[] = [
  { id: 'all', name: 'All Channels', emoji: '📱' },
  { id: 'whatsapp', name: 'WhatsApp', emoji: '💬' },
  { id: 'telegram', name: 'Telegram', emoji: '📬' },
  { id: 'facebook', name: 'Facebook', emoji: '👥' },
  { id: 'instagram', name: 'Instagram', emoji: '📸' },
  { id: 'website', name: 'Website', emoji: '🌐' },
];

const Chats: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<Platform>('all');
  const [showUpgradeMessage, setShowUpgradeMessage] = useState(false);

  useEffect(() => {
    loadMessages();
    loadCompanyLogo();
  }, [user]);

  const loadCompanyLogo = async () => {
    if (!user?.id) return;

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) return;

      const { data, error } = await supabase
        .from('company_profiles')
        .select('logo_url')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      setCompanyLogo(data?.logo_url || null);
    } catch (err) {
      console.error('Error loading company logo:', err);
    }
  };

  const loadMessages = async () => {
    if (!user?.id) return;

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        console.warn('No company found for user');
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('chatbot_messages')
        .select('*, "Ai response", "Topic"')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentInfo = (score: number) => {
    if (score > 0.6) {
      return {
        label: 'Positive',
        color: 'bg-success-50 text-success-700'
      };
    }
    if (score >= 0.3) {
      return {
        label: 'Balanced',
        color: 'bg-warning-50 text-warning-700'
      };
    }
    return {
      label: 'Negative',
      color: 'bg-error-50 text-error-700'
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceIcon = (source: ChatMessage['source']) => {
    const platform = platforms.find(p => p.id === source);
    return platform?.emoji || '💬';
  };

  const getTopicTag = (topic: string | null) => {
    if (!topic || topic.trim() === '') {
      return 'General';
    }
    return topic;
  };

  const getTopicColor = (topic: string | null) => {
    const topicValue = getTopicTag(topic);
    
    switch (topicValue.toLowerCase()) {
      case 'general':
        return 'bg-neutral-100 text-neutral-700';
      case 'support':
        return 'bg-blue-100 text-blue-700';
      case 'sales':
        return 'bg-green-100 text-green-700';
      case 'technical':
        return 'bg-purple-100 text-purple-700';
      case 'billing':
        return 'bg-yellow-100 text-yellow-700';
      case 'feedback':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-primary-100 text-primary-700';
    }
  };

  const filteredMessages = messages.filter(msg => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      msg.content.toLowerCase().includes(searchLower) ||
      msg.email?.toLowerCase().includes(searchLower) ||
      msg.subject?.toLowerCase().includes(searchLower) ||
      msg.keywords?.some(k => k.toLowerCase().includes(searchLower));

    const matchesPlatform = activePlatform === 'all' || msg.source === activePlatform;

    return matchesSearch && matchesPlatform;
  });

  const getMessageCountByPlatform = (platform: Platform) => {
    if (platform === 'all') return messages.length;
    return messages.filter(msg => msg.source === platform).length;
  };

  const isPlatformLocked = (platform: Platform) => {
    return platform !== 'all' && platform !== 'website';
  };

  const handlePlatformClick = (platform: Platform) => {
    if (isPlatformLocked(platform)) {
      setShowUpgradeMessage(true);
      return;
    }
    setActivePlatform(platform);
  };

  return (
    <div className="px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Customer Chats</h1>
        <p className="text-neutral-500">View and analyse customer conversations across all platforms</p>
      </div>

      {/* Upgrade Message */}
      {showUpgradeMessage && (
        <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center">
            <Lock size={20} className="text-primary mr-3" />
            <div>
              <p className="text-primary font-medium">Upgrade for more Advisor channels</p>
              <p className="text-sm text-primary-700">
                Access WhatsApp, Telegram, Facebook, and Instagram chat channels with Pri0r1ty Generate or Fan Sonar
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        {/* Platform Tabs */}
        <div className="border-b border-neutral-200">
          <div className="flex overflow-x-auto">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handlePlatformClick(platform.id)}
                className={`flex items-center px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activePlatform === platform.id
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : isPlatformLocked(platform.id)
                    ? 'text-neutral-400 hover:text-neutral-500'
                    : 'text-neutral-600 hover:text-primary hover:bg-primary/5'
                }`}
              >
                <span className="mr-2">{platform.emoji}</span>
                {platform.name}
                {isPlatformLocked(platform.id) && (
                  <Lock size={14} className="ml-2 text-neutral-400" />
                )}
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-neutral-100 text-neutral-600">
                  {getMessageCountByPlatform(platform.id)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search messages, emails, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
                fullWidth
              />
            </div>
            <Button
              variant="outline"
              leftIcon={<Filter size={18} />}
              className="ml-2"
            >
              Filter
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-error-50 text-error-700 rounded-md">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredMessages.length > 0 ? (
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`bg-white rounded-lg border border-neutral-200 overflow-hidden transition-all ${
                    selectedConversation === message.conversation_id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                          message.role === 'user' 
                            ? 'bg-primary/10 text-primary'
                            : 'bg-neutral-100'
                        }`}>
                          {message.role === 'user' ? (
                            <User size={18} />
                          ) : (
                            <img 
                              src="https://res.cloudinary.com/deyzbqzya/image/upload/v1750009661/Blue_Pri0r1ty_Icon_fsmbrw.png" 
                              alt="Pri0r1ty AI" 
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-neutral-900">
                              {message.email || 'Anonymous User'}
                            </span>
                            <span className="text-sm text-neutral-500">
                              via {getSourceIcon(message.source)} {message.source}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTopicColor(message.Topic)}`}>
                              {getTopicTag(message.Topic)}
                            </span>
                          </div>
                          <div className="text-sm text-neutral-500">
                            {formatDate(message.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {message.sentiment_score !== null && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            getSentimentInfo(message.sentiment_score).color
                          }`}>
                            {getSentimentInfo(message.sentiment_score).label}
                          </span>
                        )}
                        <button
                          onClick={() => setExpandedMessage(
                            expandedMessage === message.id ? null : message.id
                          )}
                          className="p-1 hover:bg-neutral-100 rounded-full"
                        >
                          {expandedMessage === message.id ? (
                            <ChevronUp size={16} className="text-neutral-400" />
                          ) : (
                            <ChevronDown size={16} className="text-neutral-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {message.subject && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-neutral-700">
                          Subject: {message.subject}
                        </span>
                      </div>
                    )}

                    <div className={`mt-2 ${
                      expandedMessage === message.id ? '' : 'line-clamp-2'
                    }`}>
                      <p className="text-neutral-700 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>

                    {/* AI Response Section - Only show when expanded */}
                    {expandedMessage === message.id && message['Ai response'] && message['Ai response'].trim() !== '' && (
                      <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center mb-2">
                          <div className="w-4 h-4 rounded-full overflow-hidden mr-2 flex items-center justify-center bg-neutral-100">
                            <img 
                              src="https://res.cloudinary.com/deyzbqzya/image/upload/v1750009661/Blue_Pri0r1ty_Icon_fsmbrw.png" 
                              alt="Pri0r1ty AI" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium text-primary">AI Advisor Response</span>
                        </div>
                        <p className="text-neutral-700 whitespace-pre-wrap text-sm">
                          {message['Ai response']}
                        </p>
                      </div>
                    )}

                    {expandedMessage === message.id && message.keywords && message.keywords.length > 0 && (
                      <div className="mt-3 flex items-center flex-wrap gap-2">
                        <TagIcon size={14} className="text-neutral-400" />
                        {message.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-neutral-100 text-neutral-700 rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-neutral-300" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No messages found</h3>
              <p className="mt-1 text-sm text-neutral-500">
                {activePlatform === 'all'
                  ? 'No chat messages match your search criteria'
                  : `No messages found for ${platforms.find(p => p.id === activePlatform)?.name}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chats;