import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Phone, ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight, Clock, MessageSquare, Tag, Filter, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VoxInboundCall, VoxOutboundCall } from '../types';
import { useAuth } from '../context/AuthContext';

interface CombinedCall {
  id: string;
  direction: 'inbound' | 'outbound';
  phone_number: string;
  name?: string;
  last_name?: string;
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
  voicemail?: boolean;
  agent_termination?: boolean;
  source_table: 'vox_inbound_calls' | 'vox_outbound_calls';
}

const VoxCallLogs: React.FC = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CombinedCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hideVoicemail, setHideVoicemail] = useState(false);
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchAllCalls();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      const allCalls: CombinedCall[] = (inboundCalls || []).map(call => ({
        ...call,
        direction: (call.call_direction || 'inbound') as 'inbound' | 'outbound',
        source_table: 'vox_inbound_calls' as const
      })).sort(
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

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const getDateKey = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
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

  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      if (hideVoicemail && call.voicemail) {
        return false;
      }

      if (directionFilter !== 'all' && call.direction !== directionFilter) {
        return false;
      }

      if (dateFrom) {
        const callDate = new Date(call.started_at).setHours(0, 0, 0, 0);
        const fromDate = new Date(dateFrom).setHours(0, 0, 0, 0);
        if (callDate < fromDate) {
          return false;
        }
      }

      if (dateTo) {
        const callDate = new Date(call.started_at).setHours(0, 0, 0, 0);
        const toDate = new Date(dateTo).setHours(23, 59, 59, 999);
        if (callDate > toDate) {
          return false;
        }
      }

      if (sentimentFilter !== 'all') {
        if (sentimentFilter === 'none') {
          if (call.sentiment_tags && call.sentiment_tags.length > 0) {
            return false;
          }
        } else {
          if (!call.sentiment_tags || !call.sentiment_tags.includes(sentimentFilter)) {
            return false;
          }
        }
      }

      if (statusFilter !== 'all' && call.call_status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [calls, hideVoicemail, directionFilter, sentimentFilter, statusFilter, dateFrom, dateTo]);

  const groupedCalls = useMemo(() => {
    const groups: Record<string, CombinedCall[]> = {};

    filteredCalls.forEach(call => {
      const dateKey = getDateKey(call.started_at);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(call);
    });

    const sortedGroups = Object.entries(groups).sort((a, b) => {
      const dateA = new Date(a[1][0].started_at);
      const dateB = new Date(b[1][0].started_at);
      return dateB.getTime() - dateA.getTime();
    });

    return sortedGroups;
  }, [filteredCalls]);

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

  const totalMinutes = Math.floor(filteredCalls.reduce((sum, call) => sum + call.call_duration, 0) / 60);
  const totalCalls = filteredCalls.length;
  const inboundCount = filteredCalls.filter(c => c.direction === 'inbound').length;

  const uniqueStatuses = Array.from(new Set(calls.map(c => c.call_status))).sort();
  const sentimentOptions = ['Positive', 'Negative', 'Neutral'];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">Call Logs</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <p className="text-sm font-medium text-neutral-600 mb-1">Total Minutes</p>
              <p className="text-3xl font-bold text-neutral-900">{totalMinutes.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-neutral-700">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-neutral-500">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="grid grid-cols-[140px_180px_280px_160px_110px_110px_90px_120px_150px_70px] gap-4 px-6 py-4 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-700">
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'direction' ? null : 'direction')}
              className="flex items-center gap-1 hover:text-neutral-900 transition-colors"
            >
              Direction
              <Filter className={`w-3 h-3 ${directionFilter !== 'all' ? 'text-blue-600' : ''}`} />
            </button>
            {openDropdown === 'direction' && (
              <div ref={dropdownRef} className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50 min-w-[160px]">
                <button
                  onClick={() => {
                    setDirectionFilter('all');
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                    directionFilter === 'all' ? 'text-blue-600 font-medium' : 'text-neutral-700'
                  }`}
                >
                  All Directions
                </button>
                <button
                  onClick={() => {
                    setDirectionFilter('inbound');
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                    directionFilter === 'inbound' ? 'text-blue-600 font-medium' : 'text-neutral-700'
                  }`}
                >
                  Inbound
                </button>
                <button
                  onClick={() => {
                    setDirectionFilter('outbound');
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                    directionFilter === 'outbound' ? 'text-blue-600 font-medium' : 'text-neutral-700'
                  }`}
                >
                  Outbound
                </button>
              </div>
            )}
          </div>
          <div>Time</div>
          <div>Name/Subject</div>
          <div>Phone Number</div>
          <div className="text-left">Duration</div>
          <div className="text-center relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'voicemail' ? null : 'voicemail')}
              className="flex items-center gap-1 justify-center hover:text-neutral-900 transition-colors w-full"
            >
              Voicemail
              <Filter className={`w-3 h-3 ${hideVoicemail ? 'text-blue-600' : ''}`} />
            </button>
            {openDropdown === 'voicemail' && (
              <div ref={dropdownRef} className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-neutral-200 p-3 z-50 min-w-[180px]">
                <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideVoicemail}
                    onChange={(e) => {
                      setHideVoicemail(e.target.checked);
                      setOpenDropdown(null);
                    }}
                    className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                  Hide
                </label>
              </div>
            )}
          </div>
          <div className="text-center">Hang up</div>
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              className="flex items-center gap-1 hover:text-neutral-900 transition-colors"
            >
              Status
              <Filter className={`w-3 h-3 ${statusFilter !== 'all' ? 'text-blue-600' : ''}`} />
            </button>
            {openDropdown === 'status' && (
              <div ref={dropdownRef} className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50 min-w-[180px]">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                    statusFilter === 'all' ? 'text-blue-600 font-medium' : 'text-neutral-700'
                  }`}
                >
                  All Statuses
                </button>
                {uniqueStatuses.map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                      statusFilter === status ? 'text-blue-600 font-medium' : 'text-neutral-700'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'sentiment' ? null : 'sentiment')}
              className="flex items-center gap-1 hover:text-neutral-900 transition-colors"
            >
              Sentiment
              <Filter className={`w-3 h-3 ${sentimentFilter !== 'all' ? 'text-blue-600' : ''}`} />
            </button>
            {openDropdown === 'sentiment' && (
              <div ref={dropdownRef} className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50 min-w-[180px]">
                <button
                  onClick={() => {
                    setSentimentFilter('all');
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                    sentimentFilter === 'all' ? 'text-blue-600 font-medium' : 'text-neutral-700'
                  }`}
                >
                  All Sentiments
                </button>
                {sentimentOptions.map(sentiment => (
                  <button
                    key={sentiment}
                    onClick={() => {
                      setSentimentFilter(sentiment);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                      sentimentFilter === sentiment ? 'text-blue-600 font-medium' : 'text-neutral-700'
                    }`}
                  >
                    {sentiment}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setSentimentFilter('none');
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                    sentimentFilter === 'none' ? 'text-blue-600 font-medium' : 'text-neutral-700'
                  }`}
                >
                  No Sentiment
                </button>
              </div>
            )}
          </div>
          <div></div>
        </div>

          {filteredCalls.length === 0 ? (
            <div className="px-6 py-12 text-center text-neutral-500">
              {calls.length === 0 ? 'No calls found. Call history will appear here.' : 'No calls match the selected filters.'}
            </div>
          ) : (
            <div>
              {groupedCalls.map(([dateKey, dateCalls]) => (
                <div key={dateKey} className="mb-8">
                  <div className="px-6 py-3 bg-neutral-100 border-b border-neutral-200">
                    <h3 className="text-sm font-semibold text-neutral-700">
                      {formatDate(dateCalls[0].started_at)}
                    </h3>
                  </div>
                  <div className="divide-y divide-neutral-200">
                    {dateCalls.map((call) => (
                      <div key={call.id}>
                        <div
                          onClick={() => toggleExpand(call.id)}
                          className="grid grid-cols-[140px_180px_280px_160px_110px_110px_90px_120px_150px_70px] gap-4 px-6 py-4 hover:bg-neutral-50 cursor-pointer transition-colors items-start"
                        >
                          <div className="w-[140px]">
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
                          <div className="text-sm text-neutral-900 w-[180px] break-words">
                            {formatTime(call.started_at)}
                  </div>
                  <div className="text-sm text-neutral-700 w-[280px] break-words">
                    {call.source_table === 'vox_inbound_calls'
                      ? (call.Subject || 'No subject')
                      : (call.name && call.last_name ? `${call.name} ${call.last_name}` : 'Unknown')}
                  </div>
                  <div className="text-sm text-neutral-900 w-[160px] break-words">
                    {call.phone_number}
                  </div>
                  <div className="text-sm text-neutral-900 w-[110px]">
                    {formatDuration(call.call_duration)}
                  </div>
                  <div className="flex justify-center items-center w-[110px] pt-0.5">
                    <input
                      type="checkbox"
                      checked={call.voicemail || false}
                      disabled
                      className="w-4 h-4 rounded border-neutral-300 text-green-600 focus:ring-0 cursor-not-allowed"
                    />
                  </div>
                  <div className="flex justify-center items-center w-[90px] pt-0.5">
                    <input
                      type="checkbox"
                      checked={call.agent_termination || false}
                      disabled
                      className="w-4 h-4 rounded border-neutral-300 text-green-600 focus:ring-0 cursor-not-allowed"
                    />
                  </div>
                  <div className="flex items-start w-[120px]">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        call.call_status
                      )}`}
                    >
                      {call.call_status}
                    </span>
                  </div>
                  <div className="flex items-start gap-1 w-[150px] flex-wrap">
                    {call.sentiment_tags && call.sentiment_tags.length > 0 ? (
                      call.sentiment_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-neutral-300">-</span>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
};

export default VoxCallLogs;
