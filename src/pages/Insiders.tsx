import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, UserRound, Mail, Phone, Building2, MoreVertical } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getCustomers, getUserCompany } from '../lib/api';
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

const Insiders: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, [user]);

  const loadContacts = async () => {
    if (!user?.id) return;
    
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        console.warn('No company found for user');
        setIsLoading(false);
        return;
      }

      const data = await getCustomers(companyId);
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setError('Failed to load contacts. Please try again later.');
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
      loadContacts();
    } catch (error) {
      console.error('Error adding insider:', error);
      setError('Failed to add insider. Please try again.');
    }
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
                leftIcon={<Filter size={18} />}
              >
                Filter
              </Button>
              <Button
                leftIcon={<Plus size={18} />}
                onClick={() => setShowAddModal(true)}
              >
                Add to Insider List
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Last Contacted</th>
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
                      <td className="py-3 px-4 text-sm text-neutral-600">
                        {insider.last_contacted
                          ? new Date(insider.last_contacted).toLocaleDateString()
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
          )}
        </div>
      </div>

      {/* Add to Insider List Modal */}
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
    </div>
  );
};

export default Insiders;