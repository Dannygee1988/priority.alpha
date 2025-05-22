import { supabase } from './supabase';

export async function getSocialMetrics(companyId: string) {
  const { data, error } = await supabase
    .from('social_metrics')
    .select(`
      id,
      company_id,
      total_followers,
      most_popular_platform,
      community_score,
      hot_topic,
      created_at,
      updated_at
    `)
    .eq('company_id', companyId)
    .single();

  if (error) {
    console.error('Error fetching social metrics:', error);
    throw error;
  }

  return data;
}