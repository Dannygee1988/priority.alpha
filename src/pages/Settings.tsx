import React, { useState, useEffect } from 'react';
import { User, Lock, Globe, Twitter, Facebook, Linkedin as LinkedIn, Instagram, Mail, Building2, ChevronRight, Plus, Trash2, Users, UserPlus } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'connections' | 'users'>('profile');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newAccount, setNewAccount] = useState({
    platform: 'twitter',
    username: '',
    password: ''
  });
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user' as const
  });

  const MAX_USERS = 5;

  useEffect(() => {
    const loadUserCount = async () => {
      if (!user?.id) return;

      try {
        const companyId = await getUserCompany(user.id);
        if (!companyId) {
          console.warn('No company found for user');
          setIsLoading(false);
          return;
        }

        // First, check if the current user has admin role
        const { data: userData, error: userError } = await supabase
          .from('user_companies')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (userError) throw userError;

        // Update user metadata with role
        if (userData?.role) {
          const { data: { user: updatedUser }, error: updateError } = await supabase.auth.updateUser({
            data: { role: userData.role }
          });

          if (updateError) throw updateError;
        }

        const { count, error: countError } = await supabase
          .from('user_companies')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        if (countError) throw countError;
        setUserCount(count || 0);
      } catch (err) {
        console.error('Error loading user count:', err);
        setError('Failed to load user count');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserCount();
  }, [user]);

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleAddUser = async () => {
    if (!user?.id || userCount >= MAX_USERS) return;
    
    // Check if the current user has admin role
    const { data: currentUser, error: roleError } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || currentUser?.role !== 'admin') {
      setError('You do not have permission to add users. Only administrators can add new users.');
      return;
    }
    
    setIsCreatingUser(true);
    setError(null);

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found for user');
      }

      const password = generatePassword();
      
      // Create new user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: password,
        options: {
          data: {
            full_name: `${newUser.firstName} ${newUser.lastName}`,
            role: newUser.role
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user?.id) {
        throw new Error('Failed to create user');
      }

      // Add user to company with specified role
      const { error: linkError } = await supabase
        .from('user_companies')
        .insert({
          user_id: authData.user.id,
          company_id: companyId,
          role: newUser.role
        });

      if (linkError) throw linkError;

      // Send welcome email
      const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: newUser.email,
          password: password,
          name: `${newUser.firstName} ${newUser.lastName}`
        }
      });

      if (emailError) {
        console.error('Error sending welcome email:', emailError);
      }

      setShowAddUserModal(false);
      setNewUser({
        email: '',
        firstName: '',
        lastName: '',
        role: 'user'
      });
      
      // Refresh user count
      const { count: newCount } = await supabase
        .from('user_companies')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      setUserCount(newCount || 0);

    } catch (err) {
      console.error('Error adding user:', err);
      setError('Failed to add user. Please try again.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const platforms = [
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'text-[#1DA1F2]' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-[#4267B2]' },
    { id: 'linkedin', name: 'LinkedIn', icon: LinkedIn, color: 'text-[#0077B5]' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-[#E4405F]' }
  ];

  const connectedAccounts = [
    {
      id: '1',
      platform: 'twitter',
      username: '@pri0r1ty',
      connected: '2024-05-22'
    },
    {
      id: '2',
      platform: 'linkedin',
      username: 'pri0r1ty-ai',
      connected: '2024-05-22'
    }
  ];

  const users = [
    {
      id: '1',
      firstName: 'David',
      lastName: 'Gee',
      email: 'dgee@pri0r1ty.com',
      role: 'admin',
      lastActive: '2024-05-22T10:30:00Z'
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sjohnson@pri0r1ty.com',
      role: 'user',
      lastActive: '2024-05-22T09:15:00Z'
    }
  ];

  const roles = [
    { id: 'admin', name: 'Administrator' },
    { id: 'user', name: 'User' },
    { id: 'viewer', name: 'Viewer' }
  ];

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
                      defaultValue="David"
                    />
                    <Input
                      label="Last Name"
                      defaultValue="Gee"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <Input
                      label="Email"
                      type="email"
                      defaultValue="dgee@pri0r1ty.com"
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
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-800">User Management</h2>
                    <p className="text-sm text-neutral-500">Manage users and their access levels</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center mb-2">
                      <span className="text-sm text-neutral-600 mr-2">Users:</span>
                      <span className="font-medium text-lg">{userCount}</span>
                      <span className="text-neutral-400 mx-1">/</span>
                      <span className="text-neutral-600">{MAX_USERS}</span>
                    </div>
                    <Button
                      leftIcon={<UserPlus size={18} />}
                      onClick={() => setShowAddUserModal(true)}
                      disabled={userCount >= MAX_USERS || user?.user_metadata?.role !== 'admin'}
                    >
                      Add User
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-error-50 text-error-700 rounded-md">
                    {error}
                  </div>
                )}

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
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-neutral-100 hover:bg-neutral-50"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <User size={16} />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-neutral-900">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-neutral-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-primary-50 text-primary-700'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}>
                              {user.role === 'admin' ? 'Administrator' : 'User'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-600">
                            {new Date(user.lastActive).toLocaleString()}
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
                      ))}
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

                <div className="space-y-4">
                  {connectedAccounts.map((account) => {
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
                            Connected {new Date(account.connected).toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error-600 hover:text-error-700"
                            leftIcon={<Trash2 size={16} />}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-8">
            <div className="p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-6">Add Social Media Account</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={newAccount.platform}
                    onChange={(e) => setNewAccount({ ...newAccount, platform: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {platforms.map((platform) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Username"
                  value={newAccount.username}
                  onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                  placeholder="Enter your username"
                />

                <Input
                  type="password"
                  label="Password"
                  value={newAccount.password}
                  onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                  placeholder="Enter your password"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddAccountModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Handle adding account
                    setShowAddAccountModal(false);
                  }}
                >
                  Add Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-8">
            <div className="p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-6">Add New User</h2>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      label="First Name"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                      placeholder="Enter first name"
                      fullWidth
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Last Name"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                      placeholder="Enter last name"
                      fullWidth
                    />
                  </div>
                </div>

                <Input
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                  fullWidth
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Role
                  </label>
                  <div className="relative w-48">
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as typeof newUser.role })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none bg-white pr-8"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none border-l border-neutral-300">
                      <ChevronRight size={16} className="transform rotate-90 text-neutral-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddUserModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddUser}
                  disabled={isCreatingUser}
                >
                  {isCreatingUser ? 'Adding...' : 'Add User'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;