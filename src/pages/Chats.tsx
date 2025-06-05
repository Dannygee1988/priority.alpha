import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, User, Bot, ChevronDown, ChevronUp, Tag as TagIcon } from 'lucide-react';
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
}

const Chats: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, [user]);

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
        .select('*')
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
    switch (source) {
      case 'website':
        return '🌐';
      case 'whatsapp':
        return '📱';
      case 'telegram':
        return '📬';
      case 'facebook':
        return '👥';
      case 'instagram':
        return '📸';
      default:
        return '💬';
    }
  };

  const filteredMessages = messages.filter(msg => {
    const searchLower = searchQuery.toLowerCase();
    return (
      msg.content.toLowerCase().includes(searchLower) ||
      msg.email?.toLowerCase().includes(searchLower) ||
      msg.subject?.toLowerCase().includes(searchLower) ||
      msg.keywords?.some(k => k.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Customer Chats</h1>
        <p className="text-neutral-500">View and analyze customer conversations across all platforms</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
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
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-accent/10 text-accent'
                        }`}>
                          {message.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-neutral-900">
                              {message.email || 'Anonymous User'}
                            </span>
                            <span className="text-sm text-neutral-500">
                              via {getSourceIcon(message.source)} {message.source}
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

                    {message.keywords && message.keywords.length > 0 && (
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
                No chat messages match your search criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chats;