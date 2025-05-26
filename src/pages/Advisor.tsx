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
  threadId?: string;
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

  // Store pending message IDs waiting for webhook responses
  const [pendingResponses, setPendingResponses] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadConversations();
    loadAssistantId();
    setupWebhookListener();
  }, [user]);

  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    }
  }, [currentConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupWebhookListener = () => {
    // Listen for webhook responses via Supabase realtime
    const channel = supabase
      .channel('advisor_responses')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'advisor_webhook_responses'
        },
        (payload) => {
          handleWebhookResponse(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleWebhookResponse = async (responseData: any) => {
    const { conversation_id, content, message_id, sources } = responseData;
    
    // Check if this response belongs to the current conversation
    if (conversation_id !== currentConversationId) return;

    try {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: content || 'No response received',
        timestamp: new Date(),
        conversation_id: conversation_id,
        sources: sources || []
      };

      // Add the assistant message to the UI
      setMessages(prev => [...prev, assistantMessage]);

      // Save to database
      const companyId = await getUserCompany(user!.id);
      if (companyId) {
        const { error: assistantSaveError } = await supabase
          .from('advisor_messages')
          .insert({
            company_id: companyId,
            conversation_id: conversation_id,
            role: 'assistant',
            content: assistantMessage.content,
            sources: assistantMessage.sources
          });

        if (assistantSaveError) {
          console.error('Error saving assistant message:', assistantSaveError);
        }
      }

      // Remove from pending responses
      setPendingResponses(prev => {
        const newSet = new Set(prev);
        newSet.delete(message_id);
        return newSet;
      });

      setIsLoading(false);
      setError(null);

    } catch (err) {
      console.error('Error handling webhook response:', err);
      setError('Failed to process response');
      setIsLoading(false);
    }
  };

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
    const messageId = crypto.randomUUID();
    const userMessage: Message = {
      id: messageId,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      conversation_id: conversationId
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Add to pending responses
    setPendingResponses(prev => new Set([...prev, messageId]));

    try {
      const companyId = await getUserCompany(user!.id);
      if (!companyId) throw new Error('Company not found');

      // Save user message
      const { error: saveError } = await supabase
        .from('advisor_messages')
        .insert({
          id: messageId,
          company_id: companyId,
          conversation_id: conversationId,
          role: 'user',
          content: userMessage.content
        });

      if (saveError) throw saveError;

      if (!currentConversationId) {
        setCurrentConversationId(conversationId);
        await loadConversations();
      }

      // Send webhook to N8N
      const webhookResponse = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          assistantId,
          conversationId,
          messageId,
          companyId,
          userId: user!.id
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook request failed: ${webhookResponse.status}`);
      }

      // The response will come via the webhook listener
      // We don't set isLoading to false here as it will be handled by the webhook response

    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
      
      // Remove from pending responses on error
      setPendingResponses(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setError(null);
    setPendingResponses(new Set()); // Clear pending responses
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
      {/* Sidebar with conversations */}
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

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
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
                    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-blue-600 prose-pre:bg-gray-50">
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
                                className="rounded-md"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code 
                                className={`${className} bg-gray-100 px-1 py-0.5 rounded text-sm`} 
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          h1: ({ children }) => (
                            <h1 className="text-xl font-bold text-gray-900 mb-4">{children}</h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-base font-medium text-gray-900 mb-2">{children}</h3>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside space-y-1 text-gray-700">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside space-y-1 text-gray-700">{children}</ol>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-blue-200 pl-4 italic text-gray-600">
                              {children}
                            </blockquote>
                          ),
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

        {/* Input area */}
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