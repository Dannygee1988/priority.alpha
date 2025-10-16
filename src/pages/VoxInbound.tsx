import React, { useEffect, useState } from 'react';
import { Phone, ChevronDown, ChevronUp, Clock, User, TrendingUp, MessageSquare, DollarSign, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VoxInboundCall } from '../types';
import { useAuth } from '../context/AuthContext';

const VoxInbound: React.FC = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<VoxInboundCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCalls();
    }
  }, [user]);

  const fetchCalls = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching calls for user:', user.id);

      const { data: userCompanies, error: companiesError } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id);

      console.log('User companies:', userCompanies, 'Error:', companiesError);

      if (companiesError) throw companiesError;

      if (!userCompanies || userCompanies.length === 0) {
        console.log('No companies found for user');
        setCalls([]);
        setLoading(false);
        return;
      }

      const companyIds = userCompanies.map(uc => uc.company_id);
      console.log('Company IDs:', companyIds);

      const { data: companies, error: companyError } = await supabase
        .from('company_profiles')
        .select('vox_agent_id')
        .in('id', companyIds);

      console.log('Companies with agent IDs:', companies, 'Error:', companyError);

      if (companyError) throw companyError;

      const agentIds = companies
        ?.map(c => c.vox_agent_id)
        .filter(id => id != null) || [];

      console.log('Agent IDs:', agentIds);

      if (agentIds.length === 0) {
        console.log('No vox agent IDs found for companies');
        setCalls([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('vox_inbound_calls')
        .select('*')
        .in('agent_id', agentIds)
        .order('started_at', { ascending: false });

      console.log('Calls data:', data, 'Error:', error);

      if (error) throw error;
      setCalls(data || []);
    } catch (error) {
      console.error('Error fetching calls:', error);
      setError('Failed to load call history. Please try again.');
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'no-answer':
        return 'bg-yellow-100 text-yellow-800';
      case 'busy':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentColor = (sentiment?: string): string => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-gray-400';
    }
  };

  const uniqueAgents = Array.from(new Set(calls.map(call => call.agent_id)));

  const filteredCalls = calls.filter(call => {
    if (filterStatus !== 'all' && call.call_status !== filterStatus) return false;
    if (filterAgent !== 'all' && call.agent_id !== filterAgent) return false;
    return true;
  });

  const toggleExpand = (callId: string) => {
    setExpandedCallId(expandedCallId === callId ? null : callId);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-neutral-600">Loading call history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">Call History</h1>
        <p className="text-neutral-600">View and manage inbound voice agent calls</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'all'
              ? 'bg-neutral-800 text-white'
              : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
          }`}
        >
          All Status
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'completed'
              ? 'bg-neutral-800 text-white'
              : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
          }`}
        >
          + Status
        </button>
        <button
          onClick={() => setFilterAgent('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterAgent === 'all'
              ? 'bg-neutral-800 text-white'
              : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
          }`}
        >
          + Agent
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="grid grid-cols-[2fr_4fr_2fr_1.5fr_1.5fr_auto] gap-4 px-6 py-4 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-700">
          <div>Date</div>
          <div>Subject</div>
          <div>Phone Number</div>
          <div>Duration</div>
          <div>Status</div>
          <div></div>
        </div>

        {filteredCalls.length === 0 ? (
          <div className="px-6 py-12 text-center text-neutral-500">
            No calls found. Inbound calls will appear here.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {filteredCalls.map((call) => (
              <div key={call.id}>
                <div
                  onClick={() => toggleExpand(call.id)}
                  className="grid grid-cols-[2fr_4fr_2fr_1.5fr_1.5fr_auto] gap-4 px-6 py-4 hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <div className="text-sm text-neutral-900 truncate">
                    {formatDateTime(call.started_at)}
                  </div>
                  <div className="text-sm text-neutral-700 truncate">
                    {call.Subject || 'No subject'}
                  </div>
                  <div className="text-sm text-neutral-900 truncate">
                    {call.phone_number}
                  </div>
                  <div className="text-sm text-neutral-900">
                    {formatDuration(call.call_duration)}
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        call.call_status
                      )}`}
                    >
                      {call.call_status.charAt(0).toUpperCase() + call.call_status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    {expandedCallId === call.id ? (
                      <ChevronUp className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                </div>

                {expandedCallId === call.id && (
                  <div className="px-6 py-6 bg-neutral-50 border-t border-neutral-200">
                    <div className="space-y-6">
                      {call.summary && (
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                            <MessageSquare className="w-4 h-4" />
                            Summary
                          </div>
                          <p className="text-sm text-neutral-900 leading-relaxed">
                            {call.summary}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {call.sentiment && (
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                              <TrendingUp className="w-4 h-4" />
                              Sentiment
                            </div>
                            <div className={`text-sm font-medium ${getSentimentColor(call.sentiment)}`}>
                              {call.sentiment.charAt(0).toUpperCase() + call.sentiment.slice(1)}
                            </div>
                          </div>
                        )}

                        {call.tags && call.tags.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                              <Tag className="w-4 h-4" />
                              Tags
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {call.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {call.notes && (
                        <div>
                          <div className="text-sm font-medium text-neutral-700 mb-2">
                            Notes
                          </div>
                          <p className="text-sm text-neutral-900 leading-relaxed">
                            {call.notes}
                          </p>
                        </div>
                      )}

                      {call.recording_url && (
                        <div>
                          <div className="text-sm font-medium text-neutral-700 mb-2">
                            Recording
                          </div>
                          <audio controls className="w-full">
                            <source src={call.recording_url} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                    </div>

                    {call.transcript && (
                      <div className="mt-6 pt-6 border-t border-neutral-200">
                        <div className="text-sm font-medium text-neutral-700 mb-3">
                          Transcript
                        </div>
                        <div className="bg-white rounded-lg border border-neutral-200 p-4 max-h-64 overflow-y-auto">
                          <p className="text-sm text-neutral-900 leading-relaxed whitespace-pre-wrap">
                            {call.transcript}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoxInbound;
