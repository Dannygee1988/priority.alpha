import React, { useState, useEffect } from 'react';
import { User, Lock, Globe, Twitter, Facebook, Linkedin as LinkedIn, Instagram, Mail, Building2, ChevronRight, Plus, Trash2, Users, UserPlus } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';

// Rest of the imports and helper functions remain the same...

interface SocialAccount {
  id: string;
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram';
  username: string;
  created_at: string;
}

const Settings: React.FC = () => {
  // Existing state...
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    loadSocialAccounts();
  }, [user]);

  const loadSocialAccounts = async () => {
    if (!user?.id) return;

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        console.warn('No company found for user');
        setIsLoadingAccounts(false);
        return;
      }

      const { data, error } = await supabase
        .from('social_accounts')
        .select('id, platform, username, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSocialAccounts(data || []);
    } catch (err) {
      console.error('Error loading social accounts:', err);
      setError('Failed to load social accounts');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!user?.id) return;

    setIsDeletingAccount(true);
    try {
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      setSocialAccounts(accounts => accounts.filter(acc => acc.id !== accountId));
    } catch (err) {
      console.error('Error deleting social account:', err);
      setError('Failed to delete social account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Rest of the component code remains the same until the Connected Accounts section...

  {/* Connected Accounts */}
  {activeTab === 'connections' && (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Connected Accounts</h2>
          <p className="text-sm text-neutral-500">Manage your connected social media accounts</p>
        </div>
        <Button
          leftIcon={<Plus size={18} />}
          onClick={() => setShowAddAccountModal(true)}
        >
          Add Account
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-error-50 text-error-700 rounded-md">
          {error}
        </div>
      )}

      {isLoadingAccounts ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : socialAccounts.length > 0 ? (
        <div className="space-y-4">
          {socialAccounts.map((account) => {
            const platform = platforms.find(p => p.id === account.platform);
            if (!platform) return null;

            return (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50"
              >
                <div className="flex items-center">
                  <div className={`${platform.color}`}>
                    <platform.icon size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-neutral-800">{platform.name}</h3>
                    <p className="text-sm text-neutral-500">{account.username}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-neutral-500">
                    Connected {new Date(account.created_at).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error-600 hover:text-error-700"
                    leftIcon={<Trash2 size={16} />}
                    onClick={() => handleDeleteAccount(account.id)}
                    isLoading={isDeletingAccount}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
          <Globe className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
          <h3 className="text-sm font-medium text-neutral-900 mb-1">No accounts connected</h3>
          <p className="text-sm text-neutral-500">
            Connect your social media accounts to manage them from one place
          </p>
        </div>
      )}
    </div>
  )}

  {/* Rest of the component code remains the same... */}