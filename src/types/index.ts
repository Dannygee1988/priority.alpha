export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Stat {
  id: string;
  title: string;
  value: string | number;
  change: number;
  icon: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
}

export interface VoxInboundCall {
  id: string;
  user_id: string;
  agent_id: string;
  phone_number: string;
  call_duration: number;
  call_status: 'completed' | 'failed' | 'no-answer' | 'busy' | 'cancelled';
  call_sid?: string;
  recording_url?: string;
  transcript?: string;
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  tags?: string[];
  notes?: string;
  cost: number;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}