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
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const subscriptionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Real-time subscription for new messages
  useEffect(() => {
    if (!currentConversationId || !user?.id) {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      return;
    }

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    subscriptionRef.current = supabase
      .channel(`conversation-${currentConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'advisor_messages',
          filter: `conversation_id=eq.${currentConversationId}`
        },
        (payload) => {
          const newMessage = payload.new as any;
          
          if (
            newMessage.role === 'assistant' && 
            !messages.find(m => m.id === newMessage.id)
          ) {
            const assistantMessage: Message = {
              id: newMessage.id,
              role: 'assistant',
              content: newMessage.content,
              timestamp: new Date(newMessage.created_at),
              conversation_id: newMessage.conversation_id,
              sources: newMessage.sources
            };

            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
            setPendingMessageId(null);
            
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }

            loadConversations();
          }
        }
      )
      .subscribe();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [currentConversationId, user?.id, messages]);

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the conversation selection
    
    if (!user?.id) return;
    
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) return;

      // Delete all messages in the conversation
      const { error } = await supabase
        .from('advisor_messages')
        .delete()
        .eq('company_id', companyId)
        .eq('conversation_id', conversationId);

      if (error) throw error;

      // If we're currently viewing the deleted conversation, clear the view
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
        setPendingMessageId(null);
        setIsLoading(false);
        setError(null);
      }

      // Reload conversations list
      loadConversations();
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete conversation');
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

      const conversationMap = new Map();
      data.forEach(msg => {
        if (!conversationMap.has(msg.conversation_id) || 
            new Date(msg.created_at) > new Date(conversationMap.get(msg.conversation_id).created_at)) {
          conversationMap.set(msg.conversation_id, msg);
        }
      });

      const conversations = Array.from(conversationMap.values()).map(msg => ({
        id: msg.conversation_id,
        created_at: msg.created_at,
        preview: msg.content.slice(0, 100) + (msg.content.length > 100 ? '...' : '')
      }));

      setConversations(conversations);
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

      const formattedMessages = data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        conversation_id: msg.conversation_id,
        sources: msg.sources
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setPendingMessageId(null);
    setIsLoading(false);
    setError(null);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Manual check function (keeping for potential future debugging)
  const checkForResponse = async () => {
    if (!pendingMessageId || !currentConversationId || !user?.id) return;

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) return;

      const { data, error } = await supabase
        .from('advisor_messages')
        .select('*')
        .eq('company_id', companyId)
        .eq('conversation_id', currentConversationId)
        .eq('role', 'assistant')
        .eq('parent_id', pendingMessageId);

      if (error) return;

      if (data.length > 0) {
        const assistantMessage = data[0];
        const newMessage: Message = {
          id: assistantMessage.id,
          role: 'assistant',
          content: assistantMessage.content,
          timestamp: new Date(assistantMessage.created_at),
          conversation_id: assistantMessage.conversation_id,
          sources: assistantMessage.sources
        };

        setMessages(prev => [...prev, newMessage]);
        setIsLoading(false);
        setPendingMessageId(null);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    } catch (err) {
      console.error('Error in manual check:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user?.id) return;

    const messageId = crypto.randomUUID();
    const conversationId = currentConversationId || crypto.randomUUID();
    
    if (!currentConversationId) {
      setCurrentConversationId(conversationId);
    }

    const userInput = input.trim();
    const newMessage: Message = {
      id: messageId,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
      conversation_id: conversationId
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    setPendingMessageId(messageId);

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      // Save user message to database
      const { error: insertError } = await supabase
        .from('advisor_messages')
        .insert({
          id: messageId,
          company_id: companyId,
          role: 'user',
          content: userInput,
          conversation_id: conversationId,
          parent_id: messages.length > 0 ? messages[messages.length - 1].id : null
        });

      if (insertError) {
        throw insertError;
      }

      // Prepare webhook payload
      const webhookPayload = {
        message: userInput,
        company_id: companyId,
        message_id: messageId,
        conversation_id: conversationId,
        assistant_id: assistantId
      };

      // Send webhook
      const webhookResponse = await fetch('https://pri0r1ty.app.n8n.cloud/webhook/25160821-3074-43d1-99ae-4108030d3eef', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookPayload)
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        throw new Error(`Webhook failed with status ${webhookResponse.status}: ${errorText}`);
      }

      const webhookData = await webhookResponse.json();

      // Check if we got an immediate response
      if (webhookData && Array.isArray(webhookData) && webhookData[0]?.output) {
        
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: webhookData[0].output,
          timestamp: new Date(),
          conversation_id: conversationId,
          sources: webhookData[0].sources || undefined
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        setPendingMessageId(null);

        // Clear timeout since we got a response
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Save assistant message to database
        try {
          await supabase
            .from('advisor_messages')
            .insert({
              id: assistantMessage.id,
              company_id: companyId,
              role: 'assistant',
              content: assistantMessage.content,
              conversation_id: conversationId,
              parent_id: messageId,
              sources: assistantMessage.sources
            });
        } catch (dbError) {
          console.error('Database save error:', dbError);
        }

        // Update conversations list
        loadConversations();
      } else {
        // No immediate response, wait for real-time update
        // Set a timeout to stop loading if no response comes within 60 seconds
        timeoutRef.current = setTimeout(() => {
          setIsLoading(false);
          setPendingMessageId(null);
          setError('Response timeout - the assistant is taking longer than expected. Please try again.');
        }, 60000); // 60 second timeout
      }

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
      setPendingMessageId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="px-4 py-8 h-[calc(100vh-4rem)] flex animate-fade-in">
      {/* Conversations Sidebar */}
      <div className="w-80 mr-8 flex flex-col">
        <div className="mb-4">
          <Button
            onClick={startNewConversation}
            leftIcon={<Plus size={18} />}
            fullWidth
          >
            New Conversation
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-sm border border-neutral-200">
          {conversations.length > 0 ? (
            <div className="divide-y divide-neutral-200">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative flex items-center hover:bg-neutral-50 transition-colors ${
                    currentConversationId === conversation.id ? 'bg-neutral-50' : ''
                  }`}
                >
                  <button
                    onClick={() => setCurrentConversationId(conversation.id)}
                    className="flex-1 text-left p-4 min-w-0"
                  >
                    <div className="flex items-start">
                      <MessageSquare size={18} className="text-neutral-400 mt-1 mr-3 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-neutral-600 line-clamp-2 break-words">
                          {conversation.preview}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {new Date(conversation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => deleteConversation(conversation.id, e)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Delete conversation"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-neutral-500">
              No conversations yet
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-2xl font-bold text-neutral-800">Business Advisor</h1>
          <p className="text-neutral-500">Get AI-powered insights and answers about your business</p>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div className="max-w-md">
                <Bot size={48} className="mx-auto text-primary mb-4" />
                <h2 className="text-lg font-semibold text-neutral-800 mb-2">
                  How can I help you today?
                </h2>
                <p className="text-neutral-500">
                  Ask me anything about your business data, documents, or general business advice.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'assistant' ? 'items-start' : 'items-start justify-end'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mr-4 mt-1">
                      <Bot size={18} />
                    </div>
                  )}

                  <div className={`flex flex-col max-w-3xl ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}>
                    <div
                      className={`relative group rounded-lg px-4 py-3 ${
                        message.role === 'assistant'
                          ? 'bg-white border border-neutral-200'
                          : 'bg-primary text-white'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-neutral max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <div className="relative">
                                    <div className="absolute right-2 top-2">
                                      <button
                                        onClick={() => copyToClipboard(String(children), message.id)}
                                        className="p-1 hover:bg-neutral-700 rounded"
                                      >
                                        {copiedId === message.id ? (
                                          <Check size={14} className="text-green-400" />
                                        ) : (
                                          <Copy size={14} className="text-neutral-400" />
                                        )}
                                      </button>
                                    </div>
                                    <SyntaxHighlighter
                                      language={match[1]}
                                      style={tomorrow}
                                      customStyle={{
                                        margin: 0,
                                        padding: '1.5rem 1rem',
                                        borderRadius: '0.5rem',
                                      }}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  </div>
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}

                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className={`absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                          message.role === 'assistant'
                            ? 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600'
                            : 'hover:bg-primary-700 text-white/60 hover:text-white'
                        }`}
                      >
                        {copiedId === message.id ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>

                    <div className={`text-xs text-neutral-400 mt-1 ${
                      message.role === 'user' ? 'text-right' : ''
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>

                    {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => setShowSources(showSources === message.id ? null : message.id)}
                          className="text-sm text-primary hover:text-primary-700 flex items-center"
                        >
                          <AlertCircle size={14} className="mr-1" />
                          {message.sources.length} source{message.sources.length !== 1 ? 's' : ''}
                        </button>

                        {showSources === message.id && (
                          <div className="mt-2 space-y-2">
                            {message.sources.map((source, index) => (
                              <div
                                key={index}
                                className="text-sm border border-neutral-200 rounded-lg p-3 bg-neutral-50"
                              >
                                <div className="font-medium text-neutral-700 mb-1">
                                  {source.title}
                                </div>
                                <div className="text-neutral-600">
                                  {source.content}
                                </div>
                                <div className="text-xs text-neutral-400 mt-1">
                                  {Math.round(source.similarity * 100)}% relevance
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center ml-4 mt-1">
                      <User size={18} />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mr-4">
                    <Bot size={18} />
                  </div>
                  <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 size={18} className="animate-spin text-neutral-400" />
                      <span className="text-sm text-neutral-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Container */}
        <div className="border-t border-neutral-200 p-4">
          {error && (
            <div className="mb-4 p-3 bg-error-50 text-error-700 rounded-lg text-sm flex justify-between items-start">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-error-500 hover:text-error-700 ml-2"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex space-x-2">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary resize-none h-[42px] max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  minHeight: '42px',
                  height: 'auto'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                }}
              />
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              isLoading={isLoading}
              className="h-[42px]"
            >
              <Send size={18} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Advisor;