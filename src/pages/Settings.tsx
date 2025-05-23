import React, { useState } from 'react';
import { User, Lock, Globe, Twitter, Facebook, Linkedin as LinkedIn, Instagram, Mail, Building2, ChevronRight, Plus, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'connections'>('profile');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    platform: 'twitter',
    username: '',
    password: ''
  });

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
    </div>
  );
};

export default Settings;