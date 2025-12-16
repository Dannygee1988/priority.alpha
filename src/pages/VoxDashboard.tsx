import React, { useEffect, useState } from 'react';
import { Phone, ArrowDownLeft, ArrowUpRight, Clock, ChevronDown, ChevronUp, MessageSquare, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface VoxCall {
  id: string;
  user_id: string;
  outbound_caller_id?: string;
  inbound_caller_id?: string;
  time_dialed?: string;
  call_direction?: 'inbound' | 'outbound';
  call_duration: number;
  tools_used?: any;
  call_terminated_by?: string;
  keyword_extraction?: any;
  sentiment?: 'positive' | 'neutral' | 'negative';
  transcript?: string;
  summary?: string;
  caller_name?: string;
  caller_address?: string;
  last_time_contacted?: string;
  call_method?: string;
  caller_notes?: string;
  caller_email?: string;
  created_at: string;
  updated_at: string;
}

const VoxDashboard: React.FC = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<VoxCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCalls();
    }
  }, [user]);

  const fetchCalls = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('vox_calls')
        .select('*')
        .eq('user_id', user.id)
        .order('time_dialed', { ascending: false, nullsFirst: false });

      if (error) throw error;

      setCalls(data || []);
    } catch (error) {
      console.error('Error fetching calls:', error);
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

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'N/A';
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

  if (!user) return null;

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-neutral-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const totalMinutes = Math.floor(calls.reduce((sum, call) => sum + call.call_duration, 0) / 60);
  const totalCalls = calls.length;
  const inboundCount = calls.filter(c => c.call_direction === 'inbound').length;
  const outboundCount = calls.filter(c => c.call_direction === 'outbound').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">Vox Dashboard</h1>
        <p className="text-neutral-600">Overview of all your call activities.</p>
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
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Recent Calls</h2>
        </div>

        {calls.length === 0 ? (
          <div className="px-6 py-12 text-center text-neutral-500">
            No calls found. Call records will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Direction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Time Dialed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Caller Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Phone Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Sentiment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {calls.map((call) => (
                  <React.Fragment key={call.id}>
                    <tr
                      onClick={() => toggleExpand(call.id)}
                      className="hover:bg-neutral-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          call.call_direction === 'inbound'
                            ? 'bg-green-100 text-green-800'
                            : call.call_direction === 'outbound'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {call.call_direction === 'inbound' ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : call.call_direction === 'outbound' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : null}
                          {call.call_direction || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {formatDateTime(call.time_dialed)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                        {call.caller_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {call.call_direction === 'inbound'
                          ? call.inbound_caller_id || 'N/A'
                          : call.outbound_caller_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {formatDuration(call.call_duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {call.sentiment ? (
                          <span className={`font-medium ${getSentimentColor(call.sentiment)}`}>
                            {call.sentiment.charAt(0).toUpperCase() + call.sentiment.slice(1)}
                          </span>
                        ) : (
                          <span className="text-neutral-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {expandedCallId === call.id ? (
                          <ChevronUp className="w-5 h-5 text-neutral-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-neutral-400" />
                        )}
                      </td>
                    </tr>
                    {expandedCallId === call.id && (
                      <tr>
                        <td colSpan={7} className="px-6 py-6 bg-neutral-50">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {call.caller_email && (
                                <div>
                                  <div className="text-sm font-medium text-neutral-700 mb-1">Email</div>
                                  <div className="text-sm text-neutral-900">{call.caller_email}</div>
                                </div>
                              )}
                              {call.caller_address && (
                                <div>
                                  <div className="text-sm font-medium text-neutral-700 mb-1">Address</div>
                                  <div className="text-sm text-neutral-900">{call.caller_address}</div>
                                </div>
                              )}
                              {call.call_method && (
                                <div>
                                  <div className="text-sm font-medium text-neutral-700 mb-1">Call Method</div>
                                  <div className="text-sm text-neutral-900">{call.call_method}</div>
                                </div>
                              )}
                              {call.call_terminated_by && (
                                <div>
                                  <div className="text-sm font-medium text-neutral-700 mb-1">Terminated By</div>
                                  <div className="text-sm text-neutral-900">{call.call_terminated_by}</div>
                                </div>
                              )}
                            </div>

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

                            {call.keyword_extraction && Array.isArray(call.keyword_extraction) && call.keyword_extraction.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                  <Tag className="w-4 h-4" />
                                  Keywords
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {call.keyword_extraction.map((keyword: string, index: number) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium"
                                    >
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {call.caller_notes && (
                              <div>
                                <div className="text-sm font-medium text-neutral-700 mb-2">Notes</div>
                                <p className="text-sm text-neutral-900 leading-relaxed">
                                  {call.caller_notes}
                                </p>
                              </div>
                            )}

                            {call.transcript && (
                              <div className="pt-4 border-t border-neutral-200">
                                <div className="text-sm font-medium text-neutral-700 mb-3">Transcript</div>
                                <div className="bg-white rounded-lg border border-neutral-200 p-4 max-h-64 overflow-y-auto">
                                  <p className="text-sm text-neutral-900 leading-relaxed whitespace-pre-wrap">
                                    {call.transcript}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoxDashboard;
