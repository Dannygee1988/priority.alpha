import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Copy, Check, AlertCircle, MessageSquare, Plus } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    }
  }, [currentConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user?.id) return;

    const messageId = crypto.randomUUID();
    const conversationId = currentConversationId || crypto.randomUUID();
    
    if (!currentConversationId) {
      setCurrentConversationId(conversationId);
    }

    const newMessage: Message = {
      id: messageId,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      conversation_id: conversationId
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      // Save user message to database
      await supabase
        .from('advisor_messages')
        .insert({
          id: messageId,
          company_id: companyId,
          role: 'user',
          content: input.trim(),
          conversation_id: conversationId,
          parent_id: messages.length > 0 ? messages[messages.length - 1].id : null
        });

      const response = await fetch('https://pri0r1ty.app.n8n.cloud/webhook/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin,
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({
          message: input.trim(),
          company_id: companyId,
          history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        conversation_id: conversationId,
        sources: data.sources
      };

      // Save assistant message to database
      await supabase
        .from('advisor_messages')
        .insert({
          id: assistantMessage.id,
          company_id: companyId,
          role: 'assistant',
          content: data.response,
          conversation_id: conversationId,
          parent_id: messageId,
          sources: data.sources
        });

      setMessages(prev => [...prev, assistantMessage]);
      loadConversations(); // Refresh conversation list
    } catch (err) {
      console.error('Error getting response:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
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
                <button
                  key={conversation.id}
                  onClick={() => setCurrentConversationId(conversation.id)}
                  className={`w-full text-left p-4 hover:bg-neutral-50 transition-colors ${
                    currentConversationId === conversation.id ? 'bg-neutral-50' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <MessageSquare size={18} className="text-neutral-400 mt-1 mr-3" />
                    <div>
                      <p className="text-sm text-neutral-600 line-clamp-2">
                        {conversation.preview}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {new Date(conversation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
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

                      {/* Copy button */}
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

                    {/* Timestamp */}
                    <div className={`text-xs text-neutral-400 mt-1 ${
                      message.role === 'user' ? 'text-right' : ''
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>

                    {/* Sources */}
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
                    <Loader2 size={18} className="animate-spin text-neutral-400" />
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
            <div className="mb-4 p-3 bg-error-50 text-error-700 rounded-lg text-sm">
              {error}
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
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary resize-none h-[42px] max-h-32"
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