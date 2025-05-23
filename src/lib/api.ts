import { supabase } from './supabase';

export async function getUserCompany(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_companies')
      .select(`
        company_id
      `)
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('Error fetching user company:', error.message);
      throw new Error(`Failed to fetch user company: ${error.message}`);
    }

    return data?.[0]?.company_id || null;
  } catch (error) {
    console.error('Error in getUserCompany:', error);
    throw new Error('Failed to fetch user company data. Please check your connection and try again.');
  }
}

export async function getSocialMetrics(companyId: string) {
  try {
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
      console.error('Error fetching social metrics:', error.message);
      throw new Error(`Failed to fetch social metrics: ${error.message}`);
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in getSocialMetrics:', error);
    throw new Error('Failed to fetch social metrics data. Please check your connection and try again.');
  }
}