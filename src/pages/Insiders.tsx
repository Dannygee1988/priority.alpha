import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, UserRound, Mail, Phone, Building2, MoreVertical, X, AlertCircle, Check, FileText, Wand2 } from 'lucide-react';
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
}

interface MarketSounding {
  id: string;
  subject: string;
  project_name: string;
  description: string | null;
  status: 'Live' | 'Cleansed';
  created_at: string;
  cleansed_at: string | null;
  insiders: string[];
}

const Insiders: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'insiders' | 'soundings'>('insiders');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [marketSoundings, setMarketSoundings] = useState<MarketSounding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSoundingModal, setShowSoundingModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedSounding, setSelectedSounding] = useState<MarketSounding | null>(null);
  const [newSounding, setNewSounding] = useState({
    subject: '',
    project_name: '',
    description: ''
  });

  const generateRandomProjectName = () => {
    const adjectives = ['Blue', 'Red', 'Green', 'Silent', 'Swift', 'Bright', 'Dark', 'Noble', 'Royal', 'Golden'];
    const nouns = ['Eagle', 'Lion', 'Star', 'Moon', 'Sun', 'River', 'Mountain', 'Ocean', 'Forest', 'Castle'];
    const elements = ['Alpha', 'Beta', 'Delta', 'Gamma', 'Omega', 'Prime', 'Zero', 'One', 'Nova', 'Core'];
    
    const randomWord = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    
    return `${randomWord(adjectives)}.${randomWord(nouns)}.${randomWord(elements)}`;
  };

  useEffect(() => {
    loadData();
  }, [user, activeView]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        console.warn('No company found for user');
        setIsLoading(false);
        return;
      }

      if (activeView === 'insiders') {
        const { data: contactsData, error: contactsError } = await supabase
          .from('crm_customers')
          .select('*')
          .eq('company_id', companyId)
          .contains('tags', ['insider'])
          .order('created_at', { ascending: false });

        if (contactsError) throw contactsError;
        setContacts(contactsData || []);
      } else {
        const { data: soundingsData, error: soundingsError } = await supabase
          .from('market_soundings')
          .select(`
            *,
            insider_soundings (
              insider_id
            )
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (soundingsError) throw soundingsError;
        
        const formattedSoundings = soundingsData?.map(sounding => ({
          ...sounding,
          insiders: sounding.insider_soundings.map(is => is.insider_id)
        })) || [];
        
        setMarketSoundings(formattedSoundings);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInsider = async () => {
    if (!selectedContact) {
      setError('Please select a contact');
      return;
    }

    try {
      const contact = contacts.find(c => c.id === selectedContact);
      if (!contact) return;

      const newTags = [...(contact.tags || []), 'insider'];
      
      const { error: updateError } = await supabase
        .from('crm_customers')
        .update({ tags: newTags })
        .eq('id', selectedContact);

      if (updateError) throw updateError;

      setShowAddModal(false);
      setSelectedContact(null);
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
          company_id: companyId
        })
        .select()
        .single();

      if (soundingError) throw soundingError;

      setMarketSoundings([{ ...sounding, insiders: [] }, ...marketSoundings]);
      setShowSoundingModal(false);
      setNewSounding({
        subject: '',
        project_name: '',
        description: ''
      });
    } catch (err) {
      console.error('Error adding market sounding:', err);
      setError('Failed to add market sounding. Please try again.');
    }
  };

  const handleCleanseSounding = async (soundingId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('market_soundings')
        .update({
          status: 'Cleansed',
          cleansed_at: new Date().toISOString()
        })
        .eq('id', soundingId);

      if (updateError) throw updateError;

      setMarketSoundings(soundings =>
        soundings.map(s =>
          s.id === soundingId
            ? { ...s, status: 'Cleansed', cleansed_at: new Date().toISOString() }
            : s
        )
      );
    } catch (err) {
      console.error('Error cleansing market sounding:', err);
      setError('Failed to cleanse market sounding. Please try again.');
    }
  };

  const filteredData = activeView === 'insiders'
    ? contacts.filter(contact =>
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : marketSoundings.filter(sounding =>
        sounding.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sounding.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sounding.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Insider List</h1>
        <p className="text-neutral-500">Manage contacts with access to confidential company information</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="border-b border-neutral-200">
          <div className="flex">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeView === 'insiders'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-neutral-600 hover:text-primary'
              }`}
              onClick={() => setActiveView('insiders')}
            >
              Insiders
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeView === 'soundings'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-neutral-600 hover:text-primary'
              }`}
              onClick={() => setActiveView('soundings')}
            >
              Market Soundings
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 max-w-md">
              <Input
                placeholder={`Search ${activeView}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
                fullWidth
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                leftIcon={<Filter size={18} />}
              >
                Filter
              </Button>
              <Button
                leftIcon={<Plus size={18} />}
                onClick={() => activeView === 'insiders' ? setShowAddModal(true) : setShowSoundingModal(true)}
              >
                Add {activeView === 'insiders' ? 'Insider' : 'Market Sounding'}
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
          ) : activeView === 'insiders' ? (
            filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Contact Info</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Company</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Last Contacted</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredData as Contact[]).map((contact) => (
                      <tr
                        key={contact.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                              <UserRound size={16} />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-neutral-900">
                                {contact.first_name} {contact.last_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-neutral-600">
                              <Mail size={14} className="mr-1" />
                              {contact.email}
                            </div>
                            {contact.phone && (
                              <div className="flex items-center text-sm text-neutral-600">
                                <Phone size={14} className="mr-1" />
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {contact.company_name && (
                            <div className="flex items-center text-sm text-neutral-600">
                              <Building2 size={14} className="mr-1" />
                              {contact.company_name}
                              {contact.job_title && (
                                <span className="text-neutral-400 ml-1">
                                  ({contact.job_title})
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            contact.type === 'Staff' ? 'bg-primary-50 text-primary-700' :
                            contact.type === 'Customer' ? 'bg-success-50 text-success-700' :
                            contact.type === 'Investor' ? 'bg-warning-50 text-warning-700' :
                            contact.type === 'Lead' ? 'bg-accent-50 text-accent-700' :
                            'bg-neutral-100 text-neutral-700'
                          }`}>
                            {contact.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-600">
                          {contact.last_contacted
                            ? new Date(contact.last_contacted).toLocaleDateString()
                            : 'Never'}
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
            )
          ) : filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Project Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Subject</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Insiders</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Created</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Cleansed</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredData as MarketSounding[]).map((sounding) => (
                    <tr
                      key={sounding.id}
                      className="border-b border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <FileText size={16} />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-neutral-900">
                              {sounding.project_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-neutral-600">
                          {sounding.subject}
                          {sounding.description && (
                            <div className="text-sm text-neutral-500 mt-0.5">
                              {sounding.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sounding.status === 'Live'
                            ? 'bg-success-50 text-success-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {sounding.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-sm text-neutral-600">
                          <UserRound size={14} className="mr-1" />
                          {sounding.insiders.length}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-600">
                        {new Date(sounding.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-600">
                        {sounding.cleansed_at
                          ? new Date(sounding.cleansed_at).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSounding(sounding)}
                          >
                            View
                          </Button>
                          {sounding.status === 'Live' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-warning-600 hover:text-warning-700"
                              onClick={() => handleCleanseSounding(sounding.id)}
                            >
                              Cleanse
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-500">No market soundings found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Insider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg my-8">
            <div className="p-8">
              <h2 className="text-xl font-bold text-neutral-800 mb-6">Add to Insider List</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Contact
                  </label>
                  <select
                    value={selectedContact || ''}
                    onChange={(e) => setSelectedContact(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedContact(null);
                  }}
                  size="lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddInsider}
                  size="lg"
                  disabled={!selectedContact}
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-neutral-800">
                  Add Market Sounding
                </h2>
                <button
                  onClick={() => {
                    setShowSoundingModal(false);
                    setNewSounding({
                      subject: '',
                      project_name: '',
                      description: ''
                    });
                  }}
                  className="p-1 hover:bg-neutral-100 rounded-full"
                >
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Project Name
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      value={newSounding.project_name}
                      onChange={(e) => setNewSounding({ ...newSounding, project_name: e.target.value })}
                      required
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setNewSounding({ ...newSounding, project_name: generateRandomProjectName() })}
                      title="Generate random project name"
                    >
                      <Wand2 size={18} />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Subject
                  </label>
                  <textarea
                    value={newSounding.subject}
                    onChange={(e) => setNewSounding({ ...newSounding, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary h-24 resize-none"
                    placeholder="Enter the subject of the market sounding..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
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

              <div className="mt-8 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSoundingModal(false);
                    setNewSounding({
                      subject: '',
                      project_name: '',
                      description: ''
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSounding}
                  disabled={!newSounding.subject.trim() || !newSounding.project_name.trim()}
                >
                  Create Market Sounding
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Market Sounding Modal */}
      {selectedSounding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-800">
                    {selectedSounding.project_name}
                  </h2>
                  <p className="text-neutral-600 mt-1">
                    {selectedSounding.subject}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedSounding.status === 'Live'
                        ? 'bg-success-50 text-success-700'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}>
                      {selectedSounding.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSounding(null)}
                  className="p-1 hover:bg-neutral-100 rounded-full"
                >
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              <div className="space-y-6">
                {selectedSounding.description && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-700 mb-2">
                      Description
                    </h3>
                    <p className="text-neutral-600">
                      {selectedSounding.description}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-neutral-700 mb-2">
                    Insiders ({selectedSounding.insiders.length})
                  </h3>
                  <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4">
                    {selectedSounding.insiders.length > 0 ? (
                      <div className="space-y-2">
                        {contacts
                          .filter(contact => selectedSounding.insiders.includes(contact.id))
                          .map(contact => (
                            <div
                              key={contact.id}
                              className="flex items-center justify-between bg-white p-3 rounded-lg border border-neutral-200"
                            >
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                  <UserRound size={16} />
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-neutral-900">
                                    {contact.first_name} {contact.last_name}
                                  </div>
                                  <div className="text-sm text-neutral-500">
                                    {contact.email}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      <p className="text-neutral-500 text-sm text-center">
                        No insiders added yet
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-neutral-500">
                      Created on {new Date(selectedSounding.created_at).toLocaleDateString()}
                    </div>
                    {selectedSounding.status === 'Live' ? (
                      <Button
                        variant="outline"
                        className="text-warning-600 hover:bg-warning-50 hover:border-warning-600"
                        onClick={() => {
                          handleCleanseSounding(selectedSounding.id);
                          setSelectedSounding(null);
                        }}
                      >
                        Cleanse Market Sounding
                      </Button>
                    ) : (
                      <div className="flex items-center text-sm text-success-600">
                        <Check size={16} className="mr-1" />
                        Cleansed on {new Date(selectedSounding.cleansed_at!).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Insiders;