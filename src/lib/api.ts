import { supabase } from './supabase';

export async function getSocialMetrics(companyId: string) {
  const { data, error } = await supabase
    .from('social_metrics')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error) {
    console.error('Error fetching social metrics:', error);
    throw error;
  }

  return data;
}