import { supabase } from './supabase';

export async function getUserCompany(userId: string) {
  const { data, error } = await supabase
    .from('user_companies')
    .select(`
      company_id
    `)
    .eq('user_id', userId)
    .limit(1);

  if (error) {
    console.error('Error fetching user company:', error);
    throw error;
  }

  return data?.[0]?.company_id || null;
}

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
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching social metrics:', error);
    throw error;
  }

  return data?.[0] || null;
}