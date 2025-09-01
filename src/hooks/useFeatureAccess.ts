import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';

interface UserProfileType {
  id: string;
  name: string;
  features: string[];
}

export const useFeatureAccess = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_companies')
        .select(`
          profile_type:user_profile_types(
            id,
            name,
            features
          )
        `)
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (error) throw error;

      setUserProfile(data?.profile_type || null);
    } catch (err) {
      console.error('Error loading user profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const hasFeatureAccess = (feature: string): boolean => {
    if (!userProfile) return false;
    return userProfile.features.includes(feature);
  };

  const isFeatureLocked = (feature: string): boolean => {
    return !hasFeatureAccess(feature);
  };

  return {
    userProfile,
    hasFeatureAccess,
    isFeatureLocked,
    isLoading
  };
};