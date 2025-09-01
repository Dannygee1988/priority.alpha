import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface UserProfile {
  id: string;
  email: string;
  profile_type: 'free' | 'premium' | 'enterprise';
  created_at: string;
}

const FEATURE_ACCESS = {
  free: ['advisor', 'gpt', 'chats'],
  premium: [
    'advisor', 'gpt', 'chats', 'social-media', 'marketing', 'analytics', 
    'calendar', 'crm', 'data', 'tools'
  ],
  enterprise: [
    'advisor', 'gpt', 'chats', 'social-media', 'marketing', 'investors', 
    'pr', 'management', 'finance', 'community', 'analytics', 'hr', 
    'calendar', 'crm', 'data', 'tools'
  ]
};

export const useFeatureAccess = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          // Default to free tier if profile not found
          setUserProfile({
            id: user.id,
            email: user.email || '',
            profile_type: 'free',
            created_at: new Date().toISOString()
          });
        } else {
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Default to free tier on error
        setUserProfile({
          id: user.id,
          email: user.email || '',
          profile_type: 'free',
          created_at: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const hasFeatureAccess = (featureKey: string): boolean => {
    if (!userProfile) return false;
    
    const userFeatures = FEATURE_ACCESS[userProfile.profile_type] || [];
    return userFeatures.includes(featureKey);
  };

  const isFeatureLocked = (featureKey: string): boolean => {
    return !hasFeatureAccess(featureKey);
  };

  const getUserTier = (): 'free' | 'premium' | 'enterprise' => {
    return userProfile?.profile_type || 'free';
  };

  return {
    userProfile,
    loading,
    hasFeatureAccess,
    isFeatureLocked,
    getUserTier
  };
};