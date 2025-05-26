import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Copy, Check, AlertCircle, MessageSquare, Plus, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  conversation_id: string;
  threadId?: string; // Add this for assistant messages
  sources?: {
    title: string;
    content: string;
    similarity: number;
  }[];
}

interface Conversation {
  id: string;
  created_at: string;
  preview: string;
}

const Advisor: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSources, setShowSources] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadConversations();
    loadAssistantId();
  }, [user]);

  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    }
  }, [currentConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadAssistantId = async () => {
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
      console.error('Error loading assistant ID:', err);
    }
  };

  const loadConversations = async () => {
    if (!user?.id) return;

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) return;

      const { data, error } = await supabase
        .from('advisor_messages')
        .select('conversation_id, created_at, content')
        .eq('company_id', companyId)
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const conversations = data.map(msg => ({
        id: msg.conversation_id,
        created_at: msg.created_at,
        preview: msg.content.slice(0, 50) + (msg.content.length > 50 ? '...' : '')
      }));

      const uniqueConversations = conversations.filter((conv, index, self) =>
        index === self.findIndex((c) => c.id === conv.id)
      );

      setConversations(uniqueConversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!user?.id) return;

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) return;

      const { data, error } = await supabase
        .from('advisor_messages')
        .select('*')
        .eq('company_id', companyId)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        conversation_id: msg.conversation_id,
        sources: msg.sources || []
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !assistantId) return;

    const conversationId = currentConversationId || crypto.randomUUID();
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      conversation_id: conversationId
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const companyId = await getUserCompany(user!.id);
      if (!companyId) throw new Error('Company not found');

      // Save user message to database
      const { error: saveError } = await supabase
        .from('advisor_messages')
        .insert({
          company_id: companyId,
          conversation_id: conversationId,
          role: 'user',
          content: userMessage.content
        });

      if (saveError) throw saveError;

      // Set current conversation if it's new
      if (!currentConversationId) {
        setCurrentConversationId(conversationId);
        await loadConversations();
      }

      // Call the advisor API
      console.log('Calling advisor API with:', {
        message: userMessage.content,
        assistantId,
        conversationId
      });

      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          assistantId,
          conversationId
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      // Parse the response
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response format from server');
      }

      console.log('Parsed response:', responseData);

      // Validate response format
      if (!responseData || typeof responseData !== 'object') {
        throw new Error('Assistant returned an invalid response format');
      }

      // Handle the assistant's response - check for the output property first
      const assistantContent = responseData.output || responseData.content || responseData.message || 'No response received';
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        conversation_id: conversationId,
        threadId: responseData.threadId, // Store threadId if needed for follow-ups
        sources: responseData.sources || []
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to database
      const { error: assistantSaveError } = await supabase
        .from('advisor_messages')
        .insert({
          company_id: companyId,
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantMessage.content,
          sources: assistantMessage.sources
        });

      if (assistantSaveError) throw assistantSaveError;

    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setError(null);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!user?.id || isDeletingConversation) return;

    setIsDeletingConversation(true);
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) return;

      const { error } = await supabase
        .from('advisor_messages')
        .delete()
        .eq('company_id', companyId)
        .eq('conversation_id', conversationId);

      if (error) throw error;

      if (currentConversationId === conversationId) {
        handleNewConversation();
      }

      await loadConversations();
    } catch (err) {
      console.error('Error deleting conversation:', err);
    } finally {
      setIsDeletingConversation(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (!assistantId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Assistant Not Configured</h3>
          <p className="text-gray-600">
            Please configure your company's assistant in the settings page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                  currentConversationId === conversation.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setCurrentConversationId(conversation.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conversation.preview}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(conversation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conversation.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                  disabled={isDeletingConversation}
                >
                  <X className="h-3 w-3 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Welcome to your AI Advisor
                </h3>
                <p className="text-gray-600">
                  Ask questions about your company, industry insights, or get strategic advice.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-3xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-lg p-4'
                      : 'bg-white rounded-lg border border-gray-200 p-4'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={tomorrow}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {message.role === 'assistant' && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        {message.sources && message.sources.length > 0 && (
                          <button
                            onClick={() =>
                              setShowSources(
                                showSources === message.id ? null : message.id
                              )
                            }
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {message.sources.length} sources
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {copiedId === message.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}

                  {showSources === message.id && message.sources && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Sources:</h4>
                      <div className="space-y-2">
                        {message.sources.map((source, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded p-3 text-sm"
                          >
                            <div className="font-medium text-gray-900 mb-1">
                              {source.title}
                            </div>
                            <div className="text-gray-600 text-xs mb-2">
                              Similarity: {(source.similarity * 100).toFixed(1)}%
                            </div>
                            <div className="text-gray-700">
                              {source.content.slice(0, 200)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-4 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your company or industry..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-6 flex items-center gap-2 self-end"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Advisor;