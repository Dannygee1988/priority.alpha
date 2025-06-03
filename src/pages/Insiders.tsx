import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, UserRound, Mail, Phone, Building2, MoreVertical, X, AlertCircle, Check, FileText, Wand2, ChevronDown, Trash2, Users } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  job_title: string | null;
  type: string;
  last_contacted: string | null;
  created_at: string;
  tags: string[];
  soundings?: {
    id: string;
    subject: string;
    project_name: string;
    status: 'Live' | 'Cleansed';
  }[];
}

interface MarketSounding {
  id: string;
  subject: string;
  description: string | null;
  project_name: string;
  type: string;
  status: 'Live' | 'Cleansed';
  created_at: string;
  cleansed_at: string | null;
  expected_cleanse_date: string | null;
  insider_count?: number;
}

const Insiders: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [marketSoundings, setMarketSoundings] = useState<MarketSounding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSoundingModal, setShowSoundingModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedSounding, setSelectedSounding] = useState<string | null>(null);
  const [soundingToDelete, setSoundingToDelete] = useState<MarketSounding | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newSounding, setNewSounding] = useState({
    subject: '',
    description: '',
    project_name: '',
    type: 'Inside Information' as const,
    expected_cleanse_date: ''
  });

  const soundingTypes = [
    'Financial Results',
    'Acquisitions and Disposals',
    'Dividend Announcements',
    'Corporate Governance Changes',
    'Share Issuance and Buybacks',
    'Regulatory Compliance',
    'Inside Information',
    'Strategic Updates',
    'Risk Factors',
    'Sustainability and Corporate Social Responsibility',
    'Fundraising'
  ] as const;

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        console.warn('No company found for user');
        setIsLoading(false);
        return;
      }

      // Load contacts with their associated soundings
      const { data: contactsData, error: contactsError } = await supabase
        .from('crm_customers')
        .select(`
          *,
          soundings:insider_soundings(
            sounding:market_soundings(
              id,
              subject,
              project_name,
              status
            )
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;

      // Transform the data to match our Contact interface
      const transformedContacts = contactsData?.map(contact => ({
        ...contact,
        soundings: contact.soundings?.map((s: any) => s.sounding)
      })) || [];

      setContacts(transformedContacts);

      // Load market soundings with insider counts
      const { data: soundingsData, error: soundingsError } = await supabase
        .from('market_soundings')
        .select(`
          *,
          insiders:insider_soundings(count)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (soundingsError) throw soundingsError;

      // Transform the data to include insider count
      const soundingsWithCounts = soundingsData?.map(sounding => ({
        ...sounding,
        insider_count: sounding.insiders?.[0]?.count || 0
      })) || [];

      setMarketSoundings(soundingsWithCounts);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInsider = async () => {
    if (!selectedContact || !selectedSounding) {
      setError('Please select both a contact and a market sounding');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('insider_soundings')
        .insert({
          insider_id: selectedContact,
          sounding_id: selectedSounding
        });

      if (insertError) throw insertError;

      // Update contact tags
      const contact = contacts.find(c => c.id === selectedContact);
      if (contact) {
        const newTags = [...(contact.tags || [])];
        if (!newTags.includes('insider')) {
          newTags.push('insider');
          
          const { error: updateError } = await supabase
            .from('crm_customers')
            .update({ tags: newTags })
            .eq('id', selectedContact);

          if (updateError) throw updateError;
        }
      }

      setShowAddModal(false);
      setSelectedContact(null);
      setSelectedSounding(null);
      loadData();
    } catch (error) {
      console.error('Error adding insider:', error);
      setError('Failed to add insider. Please try again.');
    }
  };

  const handleAddSounding = async () => {
    if (!user?.id) return;

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      const { data: sounding, error: soundingError } = await supabase
        .from('market_soundings')
        .insert({
          ...newSounding,
          company_id: companyId,
          status: 'Live'
        })
        .select()
        .single();

      if (soundingError) throw soundingError;

      setMarketSoundings([{ ...sounding, insider_count: 0 }, ...marketSoundings]);
      setShowSoundingModal(false);
      setNewSounding({
        subject: '',
        description: '',
        project_name: '',
        type: 'Inside Information',
        expected_cleanse_date: ''
      });
    } catch (err) {
      console.error('Error adding market sounding:', err);
      setError('Failed to add market sounding. Please try again.');
    }
  };

  const handleDeleteSounding = async () => {
    if (!soundingToDelete || !user?.id) return;

    setIsDeleting(true);
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      const { error: deleteError } = await supabase
        .from('market_soundings')
        .delete()
        .eq('id', soundingToDelete.id)
        .eq('company_id', companyId);

      if (deleteError) throw deleteError;

      setMarketSoundings(soundings => soundings.filter(s => s.id !== soundingToDelete.id));
      setShowDeleteConfirm(false);
      setSoundingToDelete(null);
      
      // Reload data to update insider associations
      loadData();
    } catch (err) {
      console.error('Error deleting market sounding:', err);
      setError('Failed to delete market sounding. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const generateProjectName = () => {
    const adjectives = ['Blue', 'Red', 'Green', 'Silver', 'Gold', 'Crystal', 'Swift', 'Bright', 'Alpha', 'Nova'];
    const nouns = ['Star', 'Moon', 'Sun', 'Sky', 'Ocean', 'Mountain', 'River', 'Forest', 'Peak', 'Valley'];
    const numbers = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

    const randomWord = (array: string[]) => array[Math.floor(Math.random() * array.length)];
    const projectName = `${randomWord(adjectives)}.${randomWord(nouns)}.${randomWord(numbers)}`;

    setNewSounding(prev => ({ ...prev, project_name: projectName }));
  };

  const insiders = contacts.filter(contact => contact.tags?.includes('insider'));
  
  const filteredInsiders = insiders.filter(insider =>
    `${insider.first_name} ${insider.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insider.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insider.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Insider List</h1>
        <p className="text-neutral-500">Manage contacts with access to confidential company information</p>
      </div>

      <div className="space-y-8">
        {/* Market Soundings */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="p-4 border-b border-neutral-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-neutral-800">Market Soundings</h2>
              <Button
                size="sm"
                leftIcon={<Plus size={16} />}
                onClick={() => setShowSoundingModal(true)}
              >
                Add
              </Button>
            </div>
          </div>
          <div className="p-4">
            {marketSoundings.length > 0 ? (
              <div className="space-y-2">
                {marketSoundings.map((sounding) => (
                  <div
                    key={sounding.id}
                    className="p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-neutral-800">{sounding.subject}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-sm text-neutral-500">{sounding.project_name}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {sounding.insider_count}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                          sounding.status === 'Live'
                            ? 'bg-success-50 text-success-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {sounding.status}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error-600 hover:text-error-700"
                          onClick={() => {
                            setSoundingToDelete(sounding);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    {sounding.description && (
                      <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
                        {sounding.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                      <span className="text-xs text-neutral-500">
                        Created {new Date(sounding.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-neutral-500">
                          Type: {sounding.type}
                        </span>
                        {sounding.expected_cleanse_date && (
                          <span className="text-xs text-neutral-500">
                            Expected Cleanse: {new Date(sounding.expected_cleanse_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-8 w-8 text-neutral-300" />
                <p className="mt-2 text-sm text-neutral-500">No market soundings</p>
              </div>
            )}
          </div>
        </div>

        {/* Insiders List */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search insiders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search size={18} />}
                  fullWidth
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Filter size={16} />}
                >
                  Filter
                </Button>
                <Button
                  size="sm"
                  leftIcon={<Plus size={16} />}
                  onClick={() => setShowAddModal(true)}
                >
                  Add to List
                </Button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-error-50 text-error-700 rounded-md">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredInsiders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Contact Info</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Company</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Market Soundings</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInsiders.map((insider) => (
                      <tr
                        key={insider.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                              <UserRound size={16} />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-neutral-900">
                                {insider.first_name} {insider.last_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-neutral-600">
                              <Mail size={14} className="mr-1" />
                              {insider.email}
                            </div>
                            {insider.phone && (
                              <div className="flex items-center text-sm text-neutral-600">
                                <Phone size={14} className="mr-1" />
                                {insider.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {insider.company_name && (
                            <div className="flex items-center text-sm text-neutral-600">
                              <Building2 size={14} className="mr-1" />
                              {insider.company_name}
                              {insider.job_title && (
                                <span className="text-neutral-400 ml-1">
                                  ({insider.job_title})
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-700">
                            {insider.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {insider.soundings && insider.soundings.length > 0 ? (
                              insider.soundings.map(sounding => (
                                <div
                                  key={sounding.id}
                                  className="flex items-center space-x-2"
                                >
                                  <span className={`w-2 h-2 rounded-full ${
                                    sounding.status === 'Live'
                                      ? 'bg-success-500'
                                      : 'bg-neutral-300'
                                  }`} />
                                  <span className="text-sm text-neutral-600">
                                    {sounding.subject}
                                    <span className="text-neutral-400 ml-1">
                                      ({sounding.project_name})
                                    </span>
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-sm text-neutral-500">
                                No soundings
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button className="p-1 hover:bg-neutral-100 rounded-full">
                            <MoreVertical size={16} className="text-neutral-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-500">No insiders found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add to Insider List Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-neutral-800">Add to Insider List</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedContact(null);
                    setSelectedSounding(null);
                  }}
                  className="p-1 hover:bg-neutral-100 rounded-full"
                >
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Contact
                  </label>
                  <div className="relative">
                    <select
                      value={selectedContact || ''}
                      onChange={(e) => setSelectedContact(e.target.value)}
                      className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
                    >
                      <option value="">Select a contact...</option>
                      {contacts
                        .filter(contact => !contact.tags?.includes('insider'))
                        .map((contact) => (
                          <option key={contact.id} value={contact.id}>
                            {contact.first_name} {contact.last_name} - {contact.email}
                          </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ChevronDown size={16} className="text-neutral-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Market Sounding
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSounding || ''}
                      onChange={(e) => setSelectedSounding(e.target.value)}
                      className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
                    >
                      <option value="">Select a market sounding...</option>
                      {marketSoundings
                        .filter(sounding => sounding.status === 'Live')
                        .map((sounding) => (
                          <option key={sounding.id} value={sounding.id}>
                            {sounding.subject} ({sounding.project_name})
                          </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ChevronDown size={16} className="text-neutral-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-warning-500 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-warning-800">Important Notice</h3>
                      <div className="mt-2 text-sm text-warning-700">
                        <p>
                          By adding this contact to the insider list, you confirm that:
                        </p>
                        <ul className="list-disc ml-4 mt-2 space-y-1">
                          <li>The contact has been properly briefed about their insider obligations</li>
                          <li>They understand the confidential nature of the information</li>
                          <li>They agree to maintain confidentiality</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedContact(null);
                    setSelectedSounding(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddInsider}
                  disabled={!selectedContact || !selectedSounding}
                >
                  Add to Insider List
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Market Sounding Modal */}
      {showSoundingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-neutral-800">Add Market Sounding</h2>
                <button
                  onClick={() => {
                    setShowSoundingModal(false);
                    setNewSounding({
                      subject: '',
                      description: '',
                      project_name: '',
                      type: 'Inside Information',
                      expected_cleanse_date: ''
                    });
                  }}
                  className="p-1 hover:bg-neutral-100 rounded-full"
                >
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={newSounding.subject}
                    onChange={(e) => setNewSounding({ ...newSounding, subject: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Enter subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Project Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newSounding.project_name}
                      onChange={(e) => setNewSounding({ ...newSounding, project_name: e.target.value })}
                      required
                      className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Enter project name"
                    />
                    <button
                      type="button"
                      onClick={generateProjectName}
                      title="Generate random project name"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-primary transition-colors"
                    >
                      <Wand2 className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    Click the magic wand to generate a random project name
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newSounding.type}
                    onChange={(e) => setNewSounding({ ...newSounding, type: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {soundingTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Expected Cleanse Date
                  </label>
                  <input
                    type="date"
                    value={newSounding.expected_cleanse_date}
                    onChange={(e) => setNewSounding({ ...newSounding, expected_cleanse_date: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newSounding.description}
                    onChange={(e) => setNewSounding({ ...newSounding, description: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary h-32 resize-none"
                    placeholder="Enter a description of the market sounding..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSoundingModal(false);
                    setNewSounding({
                      subject: '',
                      description: '',
                      project_name: '',
                      type: 'Inside Information',
                      expected_cleanse_date: ''
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSounding}
                  disabled={!newSounding.subject || !newSounding.project_name}
                >
                  Create Market Sounding
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-4">Delete Market Sounding</h2>
              <p className="text-neutral-600 mb-6">
                Are you sure you want to delete this market sounding? This will also remove all insider associations.
                This action cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSoundingToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-error-600 hover:bg-error-700"
                  onClick={handleDeleteSounding}
                  isLoading={isDeleting}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Insiders;