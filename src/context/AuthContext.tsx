import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { getUserCompany } from '../lib/api';

interface UserProfile {
  profileType: string;
  features: string[];
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  hasFeatureAccess: (feature: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserProfile = async (userId: string) => {
    try {
      const companyId = await getUserCompany(userId);
      if (!companyId) return;

      const { data, error } = await supabase
        .from('user_companies')
        .select(`
          subscription_status,
          subscription_expires_at,
          profile_type:user_profile_types(
            name,
            features
          )
        `)
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .single();

      if (error) throw error;

      if (data?.profile_type) {
        setUserProfile({
          profileType: data.profile_type.name,
          features: data.profile_type.features || [],
          subscriptionStatus: data.subscription_status,
          subscriptionExpiresAt: data.subscription_expires_at
        });
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  const hasFeatureAccess = (feature: string): boolean => {
    if (!userProfile) return false;
    return userProfile.features.includes(feature);
  };

  useEffect(() => {
    // Check if user is logged in from Supabase session
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          const { id, email, user_metadata } = session.user;
          const userData = {
            id,
            name: user_metadata?.full_name || email?.split('@')[0] || 'User',
            email: email || '',
            avatar: user_metadata?.avatar_url || ''
          };
          setUser(userData);
          await loadUserProfile(id);
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { id, email, user_metadata } = session.user;
        const userData = {
          id,
          name: user_metadata?.full_name || email?.split('@')[0] || 'User',
          email: email || '',
          avatar: user_metadata?.avatar_url || ''
        };
        setUser(userData);
        await loadUserProfile(id);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        const { id, email, user_metadata } = data.user;
        const userData = {
          id,
          name: user_metadata?.full_name || email?.split('@')[0] || 'User',
          email: email || '',
          avatar: user_metadata?.avatar_url || ''
        };
        setUser(userData);
        await loadUserProfile(id);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      // Don't throw the error to prevent unhandled promise rejection
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        throw signOutError;
      }
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const contextValue: AuthContextType = {
    user,
    userProfile,
    login,
    logout,
    isLoading,
    error,
    hasFeatureAccess,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};