import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Mail, Phone, Building2, UserRound, ChevronDown, Globe, MapPin, Users, DollarSign, Briefcase } from 'lucide-react';
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
  status: string;
  last_contacted: string | null;
  created_at: string;
  crm_company_id: string | null;
}

interface Company {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  description: string | null;
  annual_revenue: number | null;
  employee_count: number | null;
  status: string;
  created_at: string;
}

const CRM: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'contacts' | 'companies'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

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

      if (activeView === 'contacts') {
        const { data: contactsData, error: contactsError } = await supabase
          .from('crm_customers')
          .select(`
            *,
            crm_companies (
              id,
              name
            )
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (contactsError) throw contactsError;
        setContacts(contactsData || []);
      } else {
        const { data: companiesData, error: companiesError } = await supabase
          .from('crm_companies')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (companiesError) throw companiesError;
        setCompanies(companiesData || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    setShowAddModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-success-50 text-success-700';
      case 'inactive':
        return 'bg-neutral-100 text-neutral-700';
      case 'lead':
        return 'bg-warning-50 text-warning-700';
      case 'prospect':
        return 'bg-accent-50 text-accent-700';
      default:
        return 'bg-neutral-50 text-neutral-600';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number | null) => {
    if (!num) return '-';
    return new Intl.NumberFormat('en-GB').format(num);
  };

  const filteredData = activeView === 'contacts'
    ? contacts.filter(contact =>
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : companies.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">CRM</h1>
        <p className="text-neutral-500">Manage your contacts and companies</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="border-b border-neutral-200">
          <div className="flex">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeView === 'contacts'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-neutral-600 hover:text-primary'
              }`}
              onClick={() => setActiveView('contacts')}
            >
              Contacts
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeView === 'companies'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-neutral-600 hover:text-primary'
              }`}
              onClick={() => setActiveView('companies')}
            >
              Companies
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
                onClick={handleAddItem}
              >
                Add {activeView === 'contacts' ? 'Contact' : 'Company'}
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
          ) : filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              {activeView === 'contacts' ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Contact Info</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Company</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Status</th>
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
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                            {contact.status}
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
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Company</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Industry</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Contacts</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Revenue</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Employees</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredData as Company[]).map((company) => (
                      <tr
                        key={company.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                              <Building2 size={16} />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-neutral-900">
                                {company.name}
                              </div>
                              {company.website && (
                                <a
                                  href={company.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center mt-1"
                                >
                                  <Globe size={12} className="mr-1" />
                                  {company.website.replace(/^https?:\/\//, '')}
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center text-sm text-neutral-600">
                            <Briefcase size={14} className="mr-1" />
                            {company.industry || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center text-sm text-neutral-600">
                            <Users size={14} className="mr-1" />
                            {contacts.filter(c => c.crm_company_id === company.id).length}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center text-sm text-neutral-600">
                            <DollarSign size={14} className="mr-1" />
                            {formatCurrency(company.annual_revenue)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center text-sm text-neutral-600">
                            <Users size={14} className="mr-1" />
                            {formatNumber(company.employee_count)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(company.status)}`}>
                            {company.status}
                          </span>
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
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-500">No {activeView} found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CRM;