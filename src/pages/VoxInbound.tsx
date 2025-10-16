import React, { useEffect, useState } from 'react';
import { Phone, ChevronDown, ChevronUp, Clock, User, TrendingUp, MessageSquare, DollarSign, Tag, Settings, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VoxInboundCall } from '../types';
import { useAuth } from '../context/AuthContext';

const VoxInbound: React.FC = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<VoxInboundCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('alloy');

  useEffect(() => {
    if (user) {
      fetchCalls();
      loadAgentSettings();
    }
  }, [user]);

  const loadAgentSettings = async () => {
    if (!user) return;

    try {
      const { data: userCompanies } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id);

      if (!userCompanies || userCompanies.length === 0) return;

      const companyIds = userCompanies.map(uc => uc.company_id);

      const { data: companies } = await supabase
        .from('company_profiles')
        .select('vox_agent_enabled, vox_agent_voice')
        .in('id', companyIds)
        .maybeSingle();

      if (companies) {
        if (companies.vox_agent_enabled !== undefined) {
          setAgentEnabled(companies.vox_agent_enabled);
        }
        if (companies.vox_agent_voice) {
          setSelectedVoice(companies.vox_agent_voice);
        }
      }
    } catch (error) {
      console.error('Error loading agent settings:', error);
    }
  };

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

      const { data: crmContacts } = await supabase
        .from('crm_customers')
        .select('phone')
        .in('company_id', companyIds);

      const crmPhoneNumbers = new Set(
        (crmContacts || [])
          .map(contact => contact.phone)
          .filter(phone => phone != null)
      );

      const callsWithCrmStatus = (data || []).map(call => ({
        ...call,
        is_in_crm: crmPhoneNumbers.has(call.phone_number)
      }));

      setCalls(callsWithCrmStatus);
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

  const filteredCalls = calls;

  const toggleExpand = (callId: string) => {
    setExpandedCallId(expandedCallId === callId ? null : callId);
  };

  const handleVoiceChange = async (voice: string) => {
    setSelectedVoice(voice);
    await saveAgentSettings(agentEnabled, voice);
  };

  const handleToggleAgent = async () => {
    const newStatus = !agentEnabled;
    setAgentEnabled(newStatus);
    await saveAgentSettings(newStatus, selectedVoice);
  };

  const saveAgentSettings = async (enabled: boolean, voice: string) => {
    if (!user) return;

    try {
      const { data: userCompanies } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id);

      if (!userCompanies || userCompanies.length === 0) return;

      const companyId = userCompanies[0].company_id;

      await supabase
        .from('company_profiles')
        .update({
          vox_agent_enabled: enabled,
          vox_agent_voice: voice
        })
        .eq('id', companyId);
    } catch (error) {
      console.error('Error saving agent settings:', error);
    }
  };

  const handleSettings = () => {
    console.log('Settings clicked');
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
  const totalConversations = calls.length;
  const avgCallTime = totalConversations > 0
    ? Math.floor(calls.reduce((sum, call) => sum + call.call_duration, 0) / totalConversations)
    : 0;

  const voiceOptions = [
    { value: 'alloy', label: 'Alloy' },
    { value: 'echo', label: 'Echo' },
    { value: 'fable', label: 'Fable' },
    { value: 'onyx', label: 'Onyx' },
    { value: 'nova', label: 'Nova' },
    { value: 'shimmer', label: 'Shimmer' }
  ];

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-neutral-700">Vox Status</label>
              <button
                onClick={handleToggleAgent}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:ring-offset-2 ${
                  agentEnabled ? 'bg-green-600' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    agentEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${agentEnabled ? 'text-green-600' : 'text-neutral-500'}`}>
                {agentEnabled ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <button
            onClick={handleSettings}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-1">Total Minutes</p>
              <p className="text-3xl font-bold text-neutral-900">{totalMinutes.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-1">Total Conversations</p>
              <p className="text-3xl font-bold text-neutral-900">{totalConversations.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-1">Average Call Time</p>
              <p className="text-3xl font-bold text-neutral-900">{formatDuration(avgCallTime)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="grid grid-cols-[2fr_4fr_2fr_1.5fr_60px_1.5fr_auto] gap-4 px-6 py-4 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-700">
          <div>Date</div>
          <div>Subject</div>
          <div>Phone Number</div>
          <div>Duration</div>
          <div className="text-center">CRM</div>
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
                  className="grid grid-cols-[2fr_4fr_2fr_1.5fr_60px_1.5fr_auto] gap-4 px-6 py-4 hover:bg-neutral-50 cursor-pointer transition-colors items-center"
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
                  <div className="flex items-center justify-center border border-neutral-200 rounded-md h-8">
                    {call.is_in_crm && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
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
