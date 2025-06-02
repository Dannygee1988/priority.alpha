import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, UserRound, Mail, Phone, Building2, MoreVertical, X, AlertCircle, Check, FileText, Wand2, ChevronDown, PenLine, CheckCircle, Trash2, Upload, Calendar } from 'lucide-react';
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
  status: 'Live' | 'Cleansed';
  created_at: string;
  cleansed_at: string | null;
  expected_cleanse_date?: string;
  type: string;
  insider_count?: number;
}

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
  'Sustainability and Corporate Social Responsibility'
] as const;

type SoundingType = typeof soundingTypes[number];

const Insiders: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [marketSoundings, setMarketSoundings] = useState<MarketSounding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSoundingModal, setShowSoundingModal] = useState(false);
  const [showCleanseConfirm, setShowCleanseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedSounding, setSelectedSounding] = useState<string | null>(null);
  const [isCleansing, setIsCleansing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedContact, setEditedContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    job_title: '',
    type: 'Investor' as const
  });
  const [newSounding, setNewSounding] = useState({
    subject: '',
    description: '',
    project_name: '',
    expected_cleanse_date: '',
    type: 'Inside Information' as SoundingType,
    files: [] as File[]
  });

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

      // Load market soundings with insider count
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
      const soundingsWithCount = soundingsData?.map(sounding => ({
        ...sounding,
        insider_count: sounding.insiders?.[0]?.count || 0
      })) || [];

      setMarketSoundings(soundingsWithCount);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setEditedContact({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone || '',
      company_name: contact.company_name || '',
      job_title: contact.job_title || '',
      type: contact.type as 'Investor'
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedContact || !user?.id) return;

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      const { error: updateError } = await supabase
        .from('crm_customers')
        .update({
          ...editedContact,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedContact.id)
        .eq('company_id', companyId);

      if (updateError) throw updateError;

      setContacts(contacts.map(contact =>
        contact.id === selectedContact.id
          ? { ...contact, ...editedContact }
          : contact
      ));
      setShowEditModal(false);
      setSelectedContact(null);
    } catch (err) {
      console.error('Error updating contact:', err);
      setError('Failed to update contact. Please try again.');
    }
  };

  const handleCleanseSounding = async (soundingId: string) => {
    if (!user?.id) return;

    setIsCleansing(true);
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      // Update the market sounding status
      const { error: soundingError } = await supabase
        .from('market_soundings')
        .update({
          status: 'Cleansed',
          cleansed_at: new Date().toISOString()
        })
        .eq('id', soundingId)
        .eq('company_id', companyId);

      if (soundingError) throw soundingError;

      // Update local state
      setMarketSoundings(soundings => 
        soundings.map(sounding =>
          sounding.id === soundingId
            ? { ...sounding, status: 'Cleansed', cleansed_at: new Date().toISOString() }
            : sounding
        )
      );

      // Check if any contacts are no longer insiders
      const { data: insiderSoundings, error: insiderError } = await supabase
        .from('insider_soundings')
        .select('insider_id')
        .eq('sounding_id', soundingId);

      if (insiderError) throw insiderError;

      // For each insider, check if they have any other live soundings
      for (const { insider_id } of insiderSoundings || []) {
        const { data: otherSoundings, error: checkError } = await supabase
          .from('insider_soundings')
          .select('sounding_id')
          .eq('insider_id', insider_id)
          .neq('sounding_id', soundingId);

        if (checkError) throw checkError;

        // If this was their only sounding, remove the insider tag
        if (!otherSoundings?.length) {
          const { data: contact, error: contactError } = await supabase
            .from('crm_customers')
            .select('tags')
            .eq('id', insider_id)
            .single();

          if (contactError) throw contactError;

          const newTags = (contact?.tags || []).filter(tag => tag !== 'insider');
          
          const { error: updateError } = await supabase
            .from('crm_customers')
            .update({ tags: newTags })
            .eq('id', insider_id)
            .eq('company_id', companyId);

          if (updateError) throw updateError;
        }
      }

      // Reload data to refresh the UI
      await loadData();
    } catch (err) {
      console.error('Error cleansing market sounding:', err);
      setError('Failed to cleanse market sounding. Please try again.');
    } finally {
      setIsCleansing(false);
      setShowCleanseConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedContact || !user?.id) return;

    setIsDeleting(true);
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      // Delete insider_soundings associations first
      const { error: associationError } = await supabase
        .from('insider_soundings')
        .delete()
        .eq('insider_id', selectedContact.id);

      if (associationError) throw associationError;

      // Remove insider tag from contact
      const newTags = (selectedContact.tags || []).filter(tag => tag !== 'insider');
      const { error: contactError } = await supabase
        .from('crm_customers')
        .update({ tags: newTags })
        .eq('id', selectedContact.id)
        .eq('company_id', companyId);

      if (contactError) throw contactError;

      // Update local state
      setContacts(contacts.filter(contact => contact.id !== selectedContact.id));
      setShowDeleteConfirm(false);
      setSelectedContact(null);
    } catch (err) {
      console.error('Error deleting insider:', err);
      setError('Failed to delete insider. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddInsider = async () => {
    if (!selectedContact || !selectedSounding || !user?.id) {
      setError('Please select both a contact and a market sounding');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      // First check if the association already exists - removed .single() to fix the error
      const { data: existingAssociation, error: checkError } = await supabase
        .from('insider_soundings')
        .select('*')
        .eq('insider_id', selectedContact)
        .eq('sounding_id', selectedSounding);

      if (checkError) throw checkError;

      // Check if any associations were found
      if (existingAssociation && existingAssociation.length > 0) {
        throw new Error('This contact is already an insider for this market sounding');
      }

      // Create the insider-sounding association
      const { error: insertError } = await supabase
        .from('insider_soundings')
        .insert({
          insider_id: selectedContact,
          sounding_id: selectedSounding
        });

      if (insertError) throw insertError;

      // Get the contact's current data
      const { data: contactData, error: contactError } = await supabase
        .from('crm_customers')
        .select('tags')
        .eq('id', selectedContact)
        .single();

      if (contactError) throw contactError;

      // Update contact tags if 'insider' tag is not present
      const currentTags = contactData?.tags || [];
      if (!currentTags.includes('insider')) {
        const { error: updateError } = await supabase
          .from('crm_customers')
          .update({ 
            tags: [...currentTags, 'insider'],
            type: 'Investor'  // Ensure the contact is marked as an Investor
          })
          .eq('id', selectedContact)
          .eq('company_id', companyId);

        if (updateError) throw updateError;
      }

      // Reload data to refresh the UI
      await loadData();

      // Reset form and close modal
      setShowAddModal(false);
      setSelectedContact(null);
      setSelectedSounding(null);
      setError(null);
    } catch (err) {
      console.error('Error adding insider:', err);
      setError(err instanceof Error ? err.message : 'Failed to add insider. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSounding = async () => {
    if (!user?.id || !newSounding.subject || !newSounding.project_name) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      // First, create the market sounding
      const { data: sounding, error: soundingError } = await supabase
        .from('market_soundings')
        .insert({
          company_id: companyId,
          subject: newSounding.subject,
          description: newSounding.description,
          project_name: newSounding.project_name,
          expected_cleanse_date: newSounding.expected_cleanse_date || null,
          type: newSounding.type,
          status: 'Live'
        })
        .select()
        .single();

      if (soundingError) throw soundingError;

      // If there are files, upload them
      if (newSounding.files.length > 0) {
        const formData = new FormData();
        newSounding.files.forEach((file, index) => {
          formData.append(`file${index}`, file);
          formData.append(`filename${index}`, file.name);
        });
        formData.append('company_id', companyId);
        formData.append('sounding_id', sounding.id);
        formData.append('file_count', newSounding.files.length.toString());

        const uploadResponse = await fetch('https://pri0r1ty.app.n8n.cloud/webhook/037b4955-9a5f-4d8d-9be0-c62efaa1371c', {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload files');
        }
      }

      setMarketSoundings([sounding, ...marketSoundings]);
      setShowSoundingModal(false);
      setNewSounding({
        subject: '',
        description: '',
        project_name: '',
        expected_cleanse_date: '',
        type: 'Inside Information',
        files: []
      });
    } catch (err) {
      console.error('Error adding market sounding:', err);
      setError('Failed to add market sounding. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setNewSounding(prev => ({
        ...prev,
        files: [...prev.files, ...Array.from(files)]
      }));
    }
  };

  const handleRemoveFile = (index: number) => {
    setNewSounding(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const generateProjectName = () => {
    const adjectives = ['Blue', 'Red', 'Green', 'Silver', 'Gold', 'Crystal', 'Swift', 'Bright', 'Alpha', 'Nova'];
    const nouns = ['Star', 'Moon', 'Sun', 'Sky', 'Ocean', 'Mountain', 'River', 'Forest', 'Peak', 'Valley'];
    const numbers = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

    const randomWord = (array: string[]) => array[Math.floor(Math.random() * array.length)];
    const newProjectName = `${randomWord(adjectives)}.${randomWord(nouns)}.${randomWord(numbers)}`;

    setNewSounding(prev => ({ ...prev, project_name: newProjectName }));
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
              <div className="grid grid-cols-4 gap-4">
                {marketSoundings.map((sounding) => (
                  <div
                    key={sounding.id}
                    className="p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-neutral-800 truncate">{sounding.subject}</h3>
                          <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            sounding.status === 'Live'
                              ? 'bg-success-50 text-success-700'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}>
                            {sounding.status}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-500">
                          <span className="font-bold">Project:</span> {sounding.project_name}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          <span className="font-bold">Type:</span> {sounding.type}
                        </p>
                        {sounding.expected_cleanse_date && (
                          <p className="text-xs text-neutral-400 mt-1 flex items-center">
                            <Calendar size={12} className="mr-1" />
                            <span className="font-bold">Expected cleanse:</span> {new Date(sounding.expected_cleanse_date).toLocaleDateString()}
                          </p>
                        )}
                        <div className="mt-4 flex items-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            <UserRound size={12} className="mr-1" />
                            {sounding.insider_count} {sounding.insider_count === 1 ? 'Insider' : 'Insiders'}
                          </span>
                        </div>
                        {sounding.status === 'Live' && (
                          <div className="mt-4 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-success-600 hover:text-success-700"
                              onClick={() => handleCleanseSounding(sounding.id)}
                            >
                              <Check size={16} className="mr-1" />
                              Cleanse
                            </Button>
                          </div>
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
                  Add Insider
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
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<PenLine size={16} />}
                              onClick={() => handleEdit(insider)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Trash2 size={16} />}
                              className="text-error-600 hover:text-error-700"
                              onClick={() => {
                                setSelectedContact(insider);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
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

      {/* Edit Modal */}
      {showEditModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-neutral-800">Edit Insider</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedContact(null);
                  }}
                  className="p-1 hover:bg-neutral-100 rounded-full"
                >
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={editedContact.first_name}
                    onChange={(e) => setEditedContact({ ...editedContact, first_name: e.target.value })}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={editedContact.last_name}
                    onChange={(e) => setEditedContact({ ...editedContact, last_name: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Email"
                  type="email"
                  value={editedContact.email}
                  onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
                  required
                />

                <Input
                  label="Phone"
                  value={editedContact.phone}
                  onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
                />

                <div className="grid gri