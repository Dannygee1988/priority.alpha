import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface CompanyProfile {
  id: string;
  name: string;
  subscription_products: string[];
}

export const useFeatureAccess = () => {
  const { user } = useAuth();
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      if (!user) {
        setCompanyProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data: userCompany, error: userCompanyError } = await supabase
          .from('user_companies')
          .select('company_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (userCompanyError) {
          console.error('Error fetching user company:', userCompanyError);
          setCompanyProfile(null);
          setLoading(false);
          return;
        }

        if (!userCompany?.company_id) {
          console.error('No company_id found for user');
          setCompanyProfile(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('company_profiles')
          .select('id, name, subscription_products')
          .eq('id', userCompany.company_id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching company profile:', error);
          setCompanyProfile(null);
        } else if (data) {
          setCompanyProfile(data);
        } else {
          setCompanyProfile(null);
        }
      } catch (error) {
        console.error('Error fetching company profile:', error);
        setCompanyProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyProfile();
  }, [user]);

  const hasFeatureAccess = (featureKey: string): boolean => {
    if (!companyProfile) return false;

    const subscriptionProducts = companyProfile.subscription_products || [];
    return subscriptionProducts.includes(featureKey);
  };

  const isFeatureLocked = (featureKey: string): boolean => {
    return !hasFeatureAccess(featureKey);
  };

  const getSubscriptionProducts = (): string[] => {
    return companyProfile?.subscription_products || [];
  };

  return {
    companyProfile,
    loading,
    hasFeatureAccess,
    isFeatureLocked,
    getSubscriptionProducts
  };
};