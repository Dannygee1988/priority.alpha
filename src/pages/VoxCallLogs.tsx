import React, { useEffect, useState } from 'react';
import { Phone, ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight, Clock, User, MessageSquare, Tag, CheckCircle, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VoxInboundCall, VoxOutboundCall } from '../types';
import { useAuth } from '../context/AuthContext';

interface CombinedCall {
  id: string;
  direction: 'inbound' | 'outbound';
  phone_number: string;
  caller_name?: string;
  call_duration: number;
  call_status: string;
  status?: string;
  summary?: string;
  transcript?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentiment_tags?: string[];
  tags?: string[];
  notes?: string;
  cost: number;
  started_at: string;
  ended_at?: string;
  created_at: string;
  recording_url?: string;
  is_in_crm?: boolean;
  Subject?: string;
  source_table: 'vox_inbound_calls' | 'vox_outbound_calls';
}

const VoxCallLogs: React.FC = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CombinedCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addingToCrm, setAddingToCrm] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAllCalls();
    }
  }, [user]);

  const fetchAllCalls = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data: userCompanies, error: companiesError } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id);

      if (companiesError) throw companiesError;

      if (!userCompanies || userCompanies.length === 0) {
        setCalls([]);
        setLoading(false);
        return;
      }

      const companyIds = userCompanies.map(uc => uc.company_id);

      const { data: companies, error: companyError } = await supabase
        .from('company_profiles')
        .select('vox_agent_id')
        .in('id', companyIds);

      if (companyError) throw companyError;

      const agentIds = companies
        ?.map(c => c.vox_agent_id)
        .filter(id => id != null) || [];

      const { data: inboundCalls, error: inboundError } = await supabase
        .from('vox_inbound_calls')
        .select('*')
        .in('agent_id', agentIds)
        .eq('call_status', 'completed');

      if (inboundError) throw inboundError;

      const { data: outboundCalls, error: outboundError } = await supabase
        .from('vox_outbound_calls')
        .select('*')
        .in('agent_id', agentIds)
        .eq('call_status', 'completed');

      if (outboundError) throw outboundError;

      const { data: crmContacts } = await supabase
        .from('crm_customers')
        .select('phone')
        .in('company_id', companyIds);

      const crmPhoneNumbers = new Set(
        (crmContacts || [])
          .map(contact => contact.phone)
          .filter(phone => phone != null)
      );

      const combinedInbound: CombinedCall[] = (inboundCalls || []).map(call => ({
        ...call,
        direction: (call.call_direction || 'inbound') as 'inbound' | 'outbound',
        is_in_crm: crmPhoneNumbers.has(call.phone_number),
        source_table: 'vox_inbound_calls' as const
      }));

      const combinedOutbound: CombinedCall[] = (outboundCalls || []).map(call => ({
        ...call,
        direction: 'outbound' as const,
        is_in_crm: crmPhoneNumbers.has(call.phone_number),
        source_table: 'vox_outbound_calls' as const
      }));

      const allCalls = [...combinedInbound, ...combinedOutbound].sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );

      setCalls(allCalls);
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
      case 'queued':
        return 'bg-blue-50 text-blue-700';
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

  const toggleExpand = (callId: string) => {
    setExpandedCallId(expandedCallId === callId ? null : callId);
  };

  const handleAddToCrm = async (call: CombinedCall) => {
    if (!user) return;

    try {
      const { data: userCompanies } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id);

      if (!userCompanies || userCompanies.length === 0) return;

      const companyId = userCompanies[0].company_id;

      const { error: insertError } = await supabase
        .from('crm_contacts')
        .insert({
          company_id: companyId,
          name: call.caller_name || 'Unknown',
          phone: call.phone_number,
          source: `vox_${call.direction}`,
          notes: call.summary || ''
        });

      if (insertError) throw insertError;

      const tableName = call.direction === 'inbound' ? 'vox_inbound_calls' : 'vox_outbound_calls';
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ is_in_crm: true })
        .eq('id', call.id);

      if (updateError) throw updateError;

      setCalls(prevCalls =>
        prevCalls.map(c =>
          c.id === call.id ? { ...c, is_in_crm: true } : c
        )
      );
    } catch (error) {
      console.error('Error adding to CRM:', error);
    }
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

  const totalMinutes = Math.floor(calls.reduce((sum, call) => sum + call.call_duration, 0) / 60);
  const totalCalls = calls.length;
  const inboundCount = calls.filter(c => c.direction === 'inbound').length;
  const outboundCount = calls.filter(c => c.direction === 'outbound').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">Call Logs</h1>
        <p className="text-neutral-600">Complete history of all inbound and outbound calls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-1">Total Calls</p>
              <p className="text-3xl font-bold text-neutral-900">{totalCalls.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-1">Inbound</p>
              <p className="text-3xl font-bold text-neutral-900">{inboundCount.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-1">Outbound</p>
              <p className="text-3xl font-bold text-neutral-900">{outboundCount.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-1">Total Minutes</p>
              <p className="text-3xl font-bold text-neutral-900">{totalMinutes.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="grid grid-cols-[100px_2fr_3fr_2fr_1.5fr_60px_2fr_auto] gap-4 px-6 py-4 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-700">
          <div>Direction</div>
          <div>Date</div>
          <div>Name/Subject</div>
          <div>Phone Number</div>
          <div className="text-left">Duration</div>
          <div className="text-left">CRM</div>
          <div>Status</div>
          <div></div>
        </div>

        {calls.length === 0 ? (
          <div className="px-6 py-12 text-center text-neutral-500">
            No calls found. Call history will appear here.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {calls.map((call) => (
              <div key={call.id}>
                <div
                  onClick={() => toggleExpand(call.id)}
                  className="grid grid-cols-[100px_2fr_3fr_2fr_1.5fr_60px_2fr_auto] gap-4 px-6 py-4 hover:bg-neutral-50 cursor-pointer transition-colors items-center"
                >
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      call.direction === 'inbound'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {call.direction === 'inbound' ? (
                        <ArrowDownLeft className="w-3 h-3" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3" />
                      )}
                      {call.direction}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-900 truncate">
                    {formatDateTime(call.started_at)}
                  </div>
                  <div className="text-sm text-neutral-700 truncate">
                    {call.source_table === 'vox_inbound_calls'
                      ? (call.Subject || 'No subject')
                      : (call.caller_name || 'Unknown')}
                  </div>
                  <div className="text-sm text-neutral-900 truncate">
                    {call.phone_number}
                  </div>
                  <div className="text-sm text-neutral-900">
                    {formatDuration(call.call_duration)}
                  </div>
                  <div className="flex items-center justify-center">
                    {call.is_in_crm ? (
                      <div className="border border-neutral-200 rounded-md h-8 w-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    ) : (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setAddingToCrm(call.id);
                          await handleAddToCrm(call);
                          setAddingToCrm(null);
                        }}
                        disabled={addingToCrm === call.id}
                        className="border border-neutral-200 rounded-md h-8 w-full flex items-center justify-center hover:bg-neutral-50 hover:border-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Add to CRM"
                      >
                        <Plus className="w-5 h-5 text-neutral-400" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        call.call_status
                      )}`}
                    >
                      {call.call_status}
                    </span>
                    {call.sentiment_tags && call.sentiment_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {call.sentiment_tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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

                      {call.sentiment_tags && call.sentiment_tags.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                            <Tag className="w-4 h-4" />
                            Sentiment
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {call.sentiment_tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-neutral-100 text-neutral-700 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {call.sentiment && (
                          <div>
                            <div className="text-sm font-medium text-neutral-700 mb-2">
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

export default VoxCallLogs;
