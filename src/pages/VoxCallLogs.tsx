import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Phone, ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight, Clock, MessageSquare, Tag, Filter, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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
  const [totalCalls, setTotalCalls] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hideVoicemail, setHideVoicemail] = useState(false);
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    if (user) {
      fetchAllCalls();
    }
  }, [user, selectedMonth, selectedYear, currentPage, hideVoicemail, directionFilter, sentimentFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [hideVoicemail, directionFilter, sentimentFilter, statusFilter]);

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
        setTotalCalls(0);
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

      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

      let countQuery = supabase
        .from('vox_inbound_calls')
        .select('*', { count: 'exact', head: true })
        .in('agent_id', agentIds)
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString());

      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('call_status', statusFilter);
      } else {
        countQuery = countQuery.eq('call_status', 'completed');
      }

      if (hideVoicemail) {
        countQuery = countQuery.or('voicemail.is.null,voicemail.eq.false');
      }

      if (directionFilter !== 'all') {
        countQuery = countQuery.eq('call_direction', directionFilter);
      }

      if (sentimentFilter !== 'all') {
        if (sentimentFilter === 'none') {
          countQuery = countQuery.or('sentiment_tags.is.null,sentiment_tags.eq.{}');
        } else {
          countQuery = countQuery.contains('sentiment_tags', [sentimentFilter]);
        }
      }

      const { count } = await countQuery;

      setTotalCalls(count || 0);

      const offset = (currentPage - 1) * ITEMS_PER_PAGE;

      let dataQuery = supabase
        .from('vox_inbound_calls')
        .select('*')
        .in('agent_id', agentIds)
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString());

      if (statusFilter !== 'all') {
        dataQuery = dataQuery.eq('call_status', statusFilter);
      } else {
        dataQuery = dataQuery.eq('call_status', 'completed');
      }

      if (hideVoicemail) {
        dataQuery = dataQuery.or('voicemail.is.null,voicemail.eq.false');
      }

      if (directionFilter !== 'all') {
        dataQuery = dataQuery.eq('call_direction', directionFilter);
      }

      if (sentimentFilter !== 'all') {
        if (sentimentFilter === 'none') {
          dataQuery = dataQuery.or('sentiment_tags.is.null,sentiment_tags.eq.{}');
        } else {
          dataQuery = dataQuery.contains('sentiment_tags', [sentimentFilter]);
        }
      }

      const { data: inboundCalls, error: inboundError } = await dataQuery
        .order('started_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (inboundError) throw inboundError;

      const allCalls: CombinedCall[] = (inboundCalls || []).map(call => ({
        ...call,
        direction: (call.call_direction || 'inbound') as 'inbound' | 'outbound',
        source_table: 'vox_inbound_calls' as const
      }));

      setCalls(allCalls);
    } catch (error) {
      console.error('Error fetching calls:', error);
      setError('Failed to load call history. Please try again.');
      setCalls([]);
      setTotalCalls(0);
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

  const getSentimentTagColor = (tag: string): string => {
    const lowerTag = tag.toLowerCase();
    if (lowerTag === 'positive') {
      return 'bg-green-100 text-green-800';
    } else if (lowerTag === 'negative') {
      return 'bg-red-100 text-red-800';
    } else if (lowerTag === 'neutral') {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const toggleExpand = (callId: string) => {
    setExpandedCallId(expandedCallId === callId ? null : callId);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const availableMonths = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push({ month: date.getMonth(), year: date.getFullYear(), label: `${monthNames[date.getMonth()]} ${date.getFullYear()}` });
    }
    return months;
  }, []);

  const totalMinutes = Math.floor(calls.reduce((sum, call) => sum + call.call_duration, 0) / 60);
  const displayedCalls = calls.length;
  const inboundCount = calls.filter(c => c.direction === 'inbound').length;

  const uniqueStatuses = Array.from(new Set(calls.map(c => c.call_status))).sort();
  const sentimentOptions = ['Positive', 'Negative', 'Neutral'];

  const totalPages = Math.ceil(totalCalls / ITEMS_PER_PAGE);

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setCurrentPage(1);
    setOpenDropdown(null);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
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

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-800">Call Logs</h1>
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Calendar className="w-4 h-4 text-neutral-600" />
            <span className="text-sm font-medium text-neutral-700">
              {monthNames[selectedMonth]} {selectedYear}
            </span>
            <ChevronDown className="w-4 h-4 text-neutral-600" />
          </button>
          {openDropdown === 'month' && (
            <div ref={dropdownRef} className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
              {availableMonths.map(({ month, year, label }) => (
                <button
                  key={`${year}-${month}`}
                  onClick={() => handleMonthChange(month, year)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                    selectedMonth === month && selectedYear === year ? 'text-blue-600 font-medium bg-blue-50' : 'text-neutral-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-1">Total Calls This Month</p>
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

          {calls.length === 0 ? (
            <div className="px-6 py-12 text-center text-neutral-500">
              No calls match the selected filters.
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {calls.map((call) => (
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
                          className={`px-2 py-1 text-xs rounded-full ${getSentimentTagColor(tag)}`}
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
                        {call.sentiment_tags && call.sentiment_tags.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-neutral-700 mb-2">
                              Sentiment
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {call.sentiment_tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getSentimentTagColor(tag)}`}
                                >
                                  {tag}
                                </span>
                              ))}
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

        {calls.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-neutral-50 border-t border-neutral-200">
            <div className="text-sm text-neutral-600">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCalls)} of {totalCalls} calls
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg border transition-colors ${
                  currentPage === 1
                    ? 'border-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <div className="text-sm text-neutral-600">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg border transition-colors ${
                  currentPage === totalPages
                    ? 'border-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoxCallLogs;
