import React, { useState, useEffect } from 'react';
import { User, Lock, Globe, Twitter, Facebook, Linkedin as LinkedIn, Instagram, Mail, Building2, ChevronRight, Plus, Trash2, Users, UserPlus } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';

interface SocialAccount {
  id: string;
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram';
  username: string;
  created_at: string;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({
    username: '',
    password: '',
    apiKey: ''
  });

  const platforms = [
    { 
      id: 'twitter', 
      name: 'Twitter', 
      icon: Twitter, 
      color: 'bg-[#1DA1F2] text-white',
      hoverColor: 'hover:bg-[#1a94e4]'
    },
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: Facebook, 
      color: 'bg-[#4267B2] text-white',
      hoverColor: 'hover:bg-[#385796]'
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      icon: LinkedIn, 
      color: 'bg-[#0077B5] text-white',
      hoverColor: 'hover:bg-[#006399]'
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: Instagram, 
      color: 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white',
      hoverColor: 'hover:opacity-90'
    }
  ];

  const availablePlatforms = platforms.filter(platform => 
    !socialAccounts.some(account => account.platform === platform.id)
  );

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

  const handleAddAccount = async () => {
    if (!user?.id || !selectedPlatform) return;

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        setError('No company found for user');
        return;
      }

      const credentials = {
        password: newAccount.password,
        ...(newAccount.apiKey ? { api_key: newAccount.apiKey } : {})
      };

      const { data, error } = await supabase
        .from('social_accounts')
        .insert({
          company_id: companyId,
          platform: selectedPlatform,
          username: newAccount.username,
          credentials
        })
        .select('id, platform, username, created_at')
        .single();

      if (error) throw error;

      setSocialAccounts([data, ...socialAccounts]);
      setShowAddAccountModal(false);
      setSelectedPlatform(null);
      setNewAccount({ username: '', password: '', apiKey: '' });
    } catch (err) {
      console.error('Error adding social account:', err);
      setError('Failed to add social account');
    }
  };

  return (
    <div className="px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Settings</h1>
        <p className="text-neutral-500">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
            <div className="p-4">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'profile'
                    ? 'bg-primary text-white'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <User size={18} className="mr-3" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'security'
                    ? 'bg-primary text-white'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Lock size={18} className="mr-3" />
                Security
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'users'
                    ? 'bg-primary text-white'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Users size={18} className="mr-3" />
                Users
              </button>
              <button
                onClick={() => setActiveTab('connections')}
                className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'connections'
                    ? 'bg-primary text-white'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Globe size={18} className="mr-3" />
                Connected Accounts
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-neutral-800 mb-6">Profile Settings</h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <User size={32} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-neutral-800">Profile Photo</h3>
                      <p className="text-sm text-neutral-500 mb-2">Update your profile picture</p>
                      <Button variant="outline" size="sm">Change Photo</Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <Input
                      label="First Name"
                      defaultValue={user?.name.split(' ')[0]}
                    />
                    <Input
                      label="Last Name"
                      defaultValue={user?.name.split(' ')[1]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <Input
                      label="Email"
                      type="email"
                      defaultValue={user?.email}
                      leftIcon={<Mail size={18} />}
                    />
                    <Input
                      label="Company"
                      defaultValue="Pri0r1ty AI"
                      leftIcon={<Building2 size={18} />}
                      disabled
                    />
                  </div>

                  <div>
                    <Button>Save Changes</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-neutral-800 mb-6">Security Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-800 mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <Input
                        type="password"
                        label="Current Password"
                        placeholder="Enter your current password"
                      />
                      <Input
                        type="password"
                        label="New Password"
                        placeholder="Enter your new password"
                      />
                      <Input
                        type="password"
                        label="Confirm New Password"
                        placeholder="Confirm your new password"
                      />
                      <Button>Update Password</Button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-200">
                    <h3 className="text-sm font-medium text-neutral-800 mb-4">Two-Factor Authentication</h3>
                    <p className="text-sm text-neutral-500 mb-4">
                      Add an extra layer of security to your account by enabling two-factor authentication.
                    </p>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                </div>
              </div>
            )}

            {/* User Management */}
            {activeTab === 'users' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-800">User Management</h2>
                    <p className="text-sm text-neutral-500">Manage users and their access levels</p>
                  </div>
                  <Button
                    leftIcon={<UserPlus size={18} />}
                  >
                    Add User
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">User</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Role</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Last Active</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                              <User size={16} />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-neutral-900">
                                {user?.name}
                              </div>
                              <div className="text-sm text-neutral-500">{user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                            Administrator
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-600">
                          Just now
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error-600 hover:text-error-700"
                            leftIcon={<Trash2 size={16} />}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
                  <div className="space-y-3">
                    {socialAccounts.map((account) => {
                      const platform = platforms.find(p => p.id === account.platform);
                      if (!platform) return null;

                      return (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-all"
                        >
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-md ${platform.color} flex items-center justify-center`}>
                              <platform.icon size={16} />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-neutral-800">{platform.name}</h3>
                              <p className="text-xs text-neutral-500">@{account.username}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-xs text-neutral-500">
                              Connected {new Date(account.created_at).toLocaleDateString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-error-600 hover:text-error-700"
                              leftIcon={<Trash2 size={14} />}
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
          </div>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-6">Connect Social Account</h2>
              
              {!selectedPlatform ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-neutral-700 mb-3">Select Platform</h3>
                  {availablePlatforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform.id)}
                      className={`max-w-[240px] mx-auto flex items-center p-2 rounded-md transition-all ${platform.color} ${platform.hoverColor}`}
                    >
                      <platform.icon size={16} />
                      <span className="ml-3 text-sm">{platform.name}</span>
                      <ChevronRight className="ml-auto" size={16} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center mb-6">
                    {selectedPlatform && (() => {
                      const platform = platforms.find(p => p.id === selectedPlatform);
                      if (!platform) return null;
                      return (
                        <div className={`w-8 h-8 rounded-md ${platform.color} flex items-center justify-center mr-3`}>
                          <platform.icon size={16} />
                        </div>
                      );
                    })()}
                    <h3 className="text-lg font-medium">
                      {platforms.find(p => p.id === selectedPlatform)?.name}
                    </h3>
                  </div>

                  <Input
                    label="Username"
                    value={newAccount.username}
                    onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                    placeholder={`Enter your ${selectedPlatform} username`}
                    required
                  />

                  <Input
                    type="password"
                    label="Password"
                    value={newAccount.password}
                    onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                    placeholder="Enter your password"
                    required
                  />

                  <Input
                    label="API Key (Optional)"
                    value={newAccount.apiKey}
                    onChange={(e) => setNewAccount({ ...newAccount, apiKey: e.target.value })}
                    placeholder="Enter your API key if available"
                  />

                  <div className="mt-6 flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddAccountModal(false);
                        setSelectedPlatform(null);
                        setNewAccount({ username: '', password: '', apiKey: '' });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddAccount}
                      disabled={!newAccount.username || !newAccount.password}
                    >
                      Connect Account
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;