import React, { useState, useEffect } from 'react';
import { BarChart3, MessageSquare, Search, AlertCircle, TrendingUp, FileText, Calendar, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import { initializeFirebase, getFirestoreInstance, isFirebaseConfigured } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';

interface MessageAnalytics {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  conversation_id: string;
  sources?: {
    title: string;
    content: string;
    similarity: number;
  }[];
}

interface Conversation {
  id: string;
  message_count: number;
  first_message: string;
  created_at: string;
}

const AdvisorAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageAnalytics[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [totalMessages, setTotalMessages] = useState(0);
  const [messagesWithSources, setMessagesWithSources] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [firestoreInitialized, setFirestoreInitialized] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  useEffect(() => {
    initializeFirestoreAndLoadAnalytics();
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadConversationMessages(selectedConversation);
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  const initializeFirestoreAndLoadAnalytics = async () => {
    if (!user?.id) return;

    try {
      if (isFirebaseConfigured()) {
        try {
          initializeFirebase();
          setFirestoreInitialized(true);
          setFirestoreError(null);
        } catch (err) {
          console.error('Error initializing Firebase:', err);
          setFirestoreError('Failed to connect to Firestore');
        }
      } else {
        setFirestoreError('Firestore not configured');
      }

      await loadAnalytics();
    } catch (err) {
      console.error('Error initializing:', err);
    }
  };

  const syncMessages = async () => {
    setSyncing(true);
    setSyncStatus('Refreshing messages...');

    try {
      await loadAnalytics();
      setSyncStatus('Messages refreshed successfully');
    } catch (err) {
      console.error('Error refreshing messages:', err);
      setSyncStatus('Error refreshing messages');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const loadAnalytics = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const companyId = await getUserCompany(user.id);
      if (!companyId) return;

      let assistantMessagesFlat: MessageAnalytics[] = [];

      if (firestoreInitialized && getFirestoreInstance()) {
        try {
          const { data: companyProfile } = await supabase
            .from('company_profiles')
            .select('firestore_customer_id')
            .eq('id', companyId)
            .single();

          const customerId = companyProfile?.firestore_customer_id;

          if (!customerId) {
            setFirestoreError('Customer ID not configured');
            return;
          }

          const db = getFirestoreInstance()!;
          const conversationsRef = collection(db, 'conversations');

          console.log('Querying Firestore for customerId:', customerId);

          const q = query(
            conversationsRef,
            where('customerId', '==', customerId),
            orderBy('created_at', 'desc'),
            limit(100)
          );
          const querySnapshot = await getDocs(q);

          console.log('Firestore query returned:', querySnapshot.size, 'documents');

          const firestoreConversations: any[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            firestoreConversations.push({
              id: doc.id,
              ...data,
            });
          });

          assistantMessagesFlat = firestoreConversations.flatMap((conv: any) => {
            const messages = conv.messages || [];
            return messages.map((msg: any, idx: number) => ({
              id: `${conv.id}_${idx}`,
              role: msg.role === 'model' ? 'assistant' : 'user',
              content: msg.content || msg.text || '',
              created_at: msg.timestamp?.toDate?.()?.toISOString() || conv.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
              conversation_id: conv.id,
              sources: msg.sources || []
            }));
          });
        } catch (err: any) {
          console.error('Error fetching from Firestore:', err);
          const errorMessage = err?.message || 'Failed to fetch messages from Firestore';
          setFirestoreError(errorMessage);
          console.log('Full error details:', {
            name: err?.name,
            message: err?.message,
            code: err?.code,
            customerId
          });
        }
      } else {
        const { data: assistantThreads, error: threadsError } = await supabase
          .from('assistant_threads')
          .select(`
            id,
            thread_id,
            created_at,
            assistant_messages (
              id,
              message_id,
              role,
              content,
              created_at
            )
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (threadsError) {
          console.error('Error fetching assistant threads:', threadsError);
        }

        if (assistantThreads && assistantThreads.length > 0) {
          assistantMessagesFlat = assistantThreads.flatMap((thread: any) => {
            const messages = thread.assistant_messages || [];
            return messages.map((msg: any) => {
              const content = Array.isArray(msg.content)
                ? msg.content.map((c: any) => c.text?.value || '').join('\n')
                : typeof msg.content === 'string'
                ? msg.content
                : '';

              return {
                id: msg.message_id,
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: content,
                created_at: msg.created_at,
                conversation_id: thread.thread_id,
                sources: []
              };
            });
          });
        }
      }

      setTotalMessages(assistantMessagesFlat.length);
      const withSources = assistantMessagesFlat.filter(msg => msg.sources && msg.sources.length > 0).length;
      setMessagesWithSources(withSources);

      const conversationMap = new Map<string, Conversation>();

      assistantMessagesFlat.forEach(msg => {
        if (!conversationMap.has(msg.conversation_id)) {
          conversationMap.set(msg.conversation_id, {
            id: msg.conversation_id,
            message_count: 1,
            first_message: msg.role === 'user' ? msg.content : '',
            created_at: msg.created_at
          });
        } else {
          const conv = conversationMap.get(msg.conversation_id)!;
          conv.message_count++;
          if (msg.role === 'user' && !conv.first_message) {
            conv.first_message = msg.content;
          }
        }
      });

      const convArray = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setConversations(convArray);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    if (!user?.id) return;

    try {
      let assistantMessagesFlat: MessageAnalytics[] = [];

      if (firestoreInitialized && getFirestoreInstance()) {
        try {
          const companyId = await getUserCompany(user.id);
          if (!companyId) return;

          const { data: companyProfile } = await supabase
            .from('company_profiles')
            .select('firestore_customer_id')
            .eq('id', companyId)
            .single();

          const customerId = companyProfile?.firestore_customer_id;

          if (!customerId) {
            return;
          }

          const db = getFirestoreInstance()!;
          const conversationsRef = collection(db, 'conversations');
          const q = query(conversationsRef, where('customerId', '==', customerId));
          const querySnapshot = await getDocs(q);

          let conversationData: any = null;
          querySnapshot.forEach((doc) => {
            if (doc.id === conversationId) {
              conversationData = { id: doc.id, ...doc.data() };
            }
          });

          if (conversationData) {
            const messages = conversationData.messages || [];
            assistantMessagesFlat = messages.map((msg: any, idx: number) => ({
              id: `${conversationData.id}_${idx}`,
              role: msg.role === 'model' ? 'assistant' : 'user',
              content: msg.content || msg.text || '',
              created_at: msg.timestamp?.toDate?.()?.toISOString() || conversationData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
              conversation_id: conversationData.id,
              sources: msg.sources || []
            })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          }
        } catch (err) {
          console.error('Error fetching conversation from Firestore:', err);
        }
      } else {
        const companyId = await getUserCompany(user.id);
        if (!companyId) return;

        const { data: assistantThread, error: threadError } = await supabase
          .from('assistant_threads')
          .select(`
            id,
            thread_id,
            created_at,
            assistant_messages (
              id,
              message_id,
              role,
              content,
              created_at
            )
          `)
          .eq('company_id', companyId)
          .eq('thread_id', conversationId)
          .maybeSingle();

        if (threadError && threadError.code !== 'PGRST116') {
          console.error('Error fetching assistant thread:', threadError);
        }

        if (assistantThread) {
          const messages = assistantThread.assistant_messages || [];
          assistantMessagesFlat = messages.map((msg: any) => {
            const content = Array.isArray(msg.content)
              ? msg.content.map((c: any) => c.text?.value || '').join('\n')
              : typeof msg.content === 'string'
              ? msg.content
              : '';

            return {
              id: msg.message_id,
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: content,
              created_at: msg.created_at,
              conversation_id: assistantThread.thread_id,
              sources: []
            };
          }).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }
      }

      setMessages(assistantMessagesFlat);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.first_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="px-4 py-8 h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-neutral-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 h-[calc(100vh-4rem)] animate-fade-in overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <BarChart3 className="text-primary mr-3" size={24} />
              <h1 className="text-2xl font-bold text-neutral-800">Advisor Analytics</h1>
            </div>
            <Button
              onClick={syncMessages}
              disabled={syncing}
              leftIcon={<RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />}
            >
              {syncing ? 'Refreshing...' : 'Refresh Messages'}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-neutral-500">View AI Assistant conversations and analytics</p>
              {firestoreInitialized && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  Firestore Connected
                </span>
              )}
              {firestoreError && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                  {firestoreError}
                </span>
              )}
            </div>
            {syncStatus && (
              <p className={`text-sm ${syncStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {syncStatus}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Total Messages</p>
                <p className="text-3xl font-bold text-neutral-800">{totalMessages}</p>
              </div>
              <MessageSquare className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Conversations</p>
                <p className="text-3xl font-bold text-neutral-800">{conversations.length}</p>
              </div>
              <Calendar className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 mb-1">With Sources</p>
                <p className="text-3xl font-bold text-neutral-800">{messagesWithSources}</p>
              </div>
              <FileText className="text-orange-500" size={32} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
              <div className="p-4 border-b border-neutral-200">
                <h2 className="font-semibold text-neutral-800 mb-3">Conversations</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-[600px]">
                {filteredConversations.length > 0 ? (
                  <div className="divide-y divide-neutral-200">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`w-full text-left p-4 hover:bg-neutral-50 transition-colors ${
                          selectedConversation === conv.id ? 'bg-blue-50 border-l-4 border-primary' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium text-neutral-800 line-clamp-2">
                            {conv.first_message || 'No message'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-neutral-500">
                          <span>{conv.message_count} messages</span>
                          <span>{formatDate(conv.created_at)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-neutral-500">
                    No conversations found
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 min-h-[600px]">
              {selectedConversation ? (
                <div className="p-6">
                  <h2 className="font-semibold text-neutral-800 mb-4">Message Details</h2>

                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`border rounded-lg p-4 ${
                          message.role === 'assistant'
                            ? 'border-primary bg-primary/5'
                            : 'border-neutral-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            message.role === 'assistant'
                              ? 'bg-primary text-white'
                              : 'bg-neutral-200 text-neutral-700'
                          }`}>
                            {message.role.toUpperCase()}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {formatDate(message.created_at)}
                          </span>
                        </div>

                        <p className="text-sm text-neutral-700 mb-3 whitespace-pre-wrap">
                          {message.content}
                        </p>

                        {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-neutral-200">
                            <button
                              onClick={() => setExpandedMessage(
                                expandedMessage === message.id ? null : message.id
                              )}
                              className="flex items-center text-sm text-primary hover:text-primary-700 font-medium mb-2"
                            >
                              <TrendingUp size={14} className="mr-1" />
                              {message.sources.length} Source{message.sources.length !== 1 ? 's' : ''} Used
                            </button>

                            {expandedMessage === message.id && (
                              <div className="space-y-3 mt-3">
                                {message.sources.map((source, index) => (
                                  <div
                                    key={index}
                                    className="bg-white border border-neutral-200 rounded-lg p-3"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="text-sm font-semibold text-neutral-800">
                                        {source.title}
                                      </h4>
                                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                        {Math.round(source.similarity * 100)}% match
                                      </span>
                                    </div>
                                    <p className="text-xs text-neutral-600 leading-relaxed">
                                      {source.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {message.role === 'assistant' && (!message.sources || message.sources.length === 0) && (
                          <div className="mt-3 pt-3 border-t border-neutral-200">
                            <div className="flex items-center text-xs text-neutral-500">
                              <AlertCircle size={12} className="mr-1" />
                              No sources used for this response
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-6">
                  <div className="text-center text-neutral-500">
                    <MessageSquare size={48} className="mx-auto mb-4 text-neutral-400" />
                    <p>Select a conversation to view message details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorAnalytics;
