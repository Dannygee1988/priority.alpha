import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, UserRound, Mail, Phone, Building2, MoreVertical, X, Tag as TagIcon, Trash2, Users, DollarSign, Briefcase, ChevronDown, Globe, MapPin, Twitter, Facebook, Linkedin, Instagram } from 'lucide-react';
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
  crm_company_id: string | null;
}

interface Company {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  description: string | null;
  annual_revenue: string | null;
  employee_count: string | null;
  status: string;
  created_at: string;
  social_links?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

const getCustomers = async (companyId: string): Promise<Contact[]> => {
  const { data, error } = await supabase
    .from('crm_customers')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const getCompanies = async (companyId: string): Promise<Company[]> => {
  const { data, error } = await supabase
    .from('crm_companies')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const CRM: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeView, setActiveView] = useState<'contacts' | 'companies'>('contacts');
  const [noCompanyAssociation, setNoCompanyAssociation] = useState(false);

  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    job_title: '',
    type: 'Customer' as const,
    crm_company_id: '' as string | null
  });

  const [newCompany, setNewCompany] = useState({
    name: '',
    industry: '',
    website: '',
    description: '',
    annual_revenue: '',
    employee_count: '',
    status: 'customer' as const,
    social_links: {
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: ''
    }
  });

  const industries = [
    'Financial Services',
    'Retail & E-commerce',
    'Energy (Oil & Gas, Renewable Energy, Utilities)',
    'Automotive (Manufacturing & Sales)',
    'Healthcare & Pharmaceuticals',
    'Information Technology (IT)',
    'Artificial Intelligence (AI) & Machine Learning',
    'Cloud Computing',
    'Biotechnology',
    'Telecommunications',
    'Manufacturing',
    'Construction',
    'Agriculture'
  ];

  const employeeRanges = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1001-5000',
    '5001-10000',
    '10000+'
  ];

  const revenueRanges = [
    'Under £1M',
    '£1M - £5M',
    '£5M - £10M',
    '£10M - £50M',
    '£50M - £100M',
    '£100M - £500M',
    '£500M - £1B',
    'Over £1B'
  ];

  const contactTypes = ['Staff', 'Customer', 'Investor', 'Lead', 'Advisor', 'Other'] as const;
  const companyStatuses = ['customer', 'competitor', 'supplier', 'lead', 'closed'] as const;

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      setNoCompanyAssociation(false);

      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        setNoCompanyAssociation(true);
        return;
      }

      const [contactsData, companiesData] = await Promise.all([
        getCustomers(companyId),
        getCompanies(companyId)
      ]);

      setContacts(contactsData);
      setCompanies(companiesData);
    } catch (err) {
      console.error('Error loading CRM data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load CRM data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForms = () => {
    setNewContact({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company_name: '',
      job_title: '',
      type: 'Customer',
      crm_company_id: null
    });
    setNewCompany({
      name: '',
      industry: '',
      website: '',
      description: '',
      annual_revenue: '',
      employee_count: '',
      status: 'customer',
      social_links: {
        linkedin: '',
        twitter: '',
        facebook: '',
        instagram: ''
      }
    });
  };

  const handleAddItem = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setError(null);

      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found for user');
      }

      if (activeView === 'contacts') {
        const { data, error } = await supabase
          .from('crm_customers')
          .insert([{
            ...newContact,
            company_id: companyId,
            crm_company_id: newContact.crm_company_id || null
          }])
          .select()
          .single();

        if (error) throw error;
        setContacts(prev => [data, ...prev]);
      } else {
        const { data, error } = await supabase
          .from('crm_companies')
          .insert([{
            ...newCompany,
            company_id: companyId,
            annual_revenue: newCompany.annual_revenue,
            employee_count: newCompany.employee_count
          }])
          .select()
          .single();

        if (error) throw error;
        setCompanies(prev => [data, ...prev]);
      }

      setShowAddModal(false);
      resetForms();
    } catch (err) {
      console.error('Error adding item:', err);
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setIsSaving(false);
    }
  };

  if (noCompanyAssociation) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Company Association Found</h2>
          <p className="text-gray-600 mb-6">
            Your user account is not associated with any company. Please contact your administrator to set up the proper company association.
          </p>
          <p className="text-sm text-gray-500">
            This is required to access the CRM features and manage contacts and companies.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">CRM</h1>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'contacts'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveView('contacts')}
                >
                  Contacts
                </button>
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'companies'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveView('companies')}
                >
                  Companies
                </button>
              </div>
            </div>
            <Button onClick={() => setShowAddModal(true)} size="lg">
              <Plus size={20} className="mr-2" />
              Add {activeView === 'contacts' ? 'Contact' : 'Company'}
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={20} className="text-gray-400" />}
              />
            </div>
            <Button variant="outline" size="lg">
              <Filter size={20} className="mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : activeView === 'contacts' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserRound size={20} className="text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{contact.first_name} {contact.last_name}</div>
                          <div className="text-sm text-gray-500">{contact.job_title || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail size={16} className="mr-2 text-gray-400" />
                        {contact.email}
                      </div>
                      {contact.phone && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Phone size={16} className="mr-2 text-gray-400" />
                          {contact.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Building2 size={16} className="mr-2 text-gray-400" />
                        {contact.company_name || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                        {contact.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {contact.last_contacted ? new Date(contact.last_contacted).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-gray-500">
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Building2 size={20} className="text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.industry || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {company.website && (
                        <div className="text-sm text-gray-900 flex items-center">
                          <Globe size={16} className="mr-2 text-gray-400" />
                          {company.website}
                        </div>
                      )}
                      {company.employee_count && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Users size={16} className="mr-2 text-gray-400" />
                          {company.employee_count} employees
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        company.status === 'customer'
                          ? 'bg-green-50 text-green-700'
                          : company.status === 'closed'
                          ? 'bg-gray-100 text-gray-700'
                          : company.status === 'competitor'
                          ? 'bg-red-50 text-red-700'
                          : company.status === 'supplier'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(company.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-gray-500">
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-neutral-800">
                  Add {activeView === 'contacts' ? 'Contact' : 'Company'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForms();
                  }}
                  className="p-1 hover:bg-neutral-100 rounded-full"
                >
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>
              
              {activeView === 'contacts' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <Input
                      label="First Name"
                      value={newContact.first_name}
                      onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                      required
                    />
                    <Input
                      label="Last Name"
                      value={newContact.last_name}
                      onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <Input
                      label="Email"
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      required
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Associated Company
                      </label>
                      <div className="relative">
                        <select
                          value={newContact.crm_company_id || ''}
                          onChange={(e) => setNewContact({ ...newContact, crm_company_id: e.target.value || null })}
                          className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
                        >
                          <option value="">No company</option>
                          {companies.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <ChevronDown size={16} className="text-neutral-400" />
                        </div>
                      </div>
                    </div>
                    <Input
                      label="Job Title"
                      value={newContact.job_title}
                      onChange={(e) => setNewContact({ ...newContact, job_title: e.target.value })}
                    />
                  </div>

                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Type
                    </label>
                    <div className="relative">
                      <select
                        value={newContact.type}
                        onChange={(e) => setNewContact({ ...newContact, type: e.target.value as typeof contactTypes[number] })}
                        className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
                      >
                        {contactTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <ChevronDown size={16} className="text-neutral-400" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <Input
                    label="Company Name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    required
                  />
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Industry
                      </label>
                      <div className="relative">
                        <select
                          value={newCompany.industry}
                          onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                          className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
                        >
                          <option value="">Select industry...</option>
                          {industries.map((industry) => (
                            <option key={industry} value={industry}>{industry}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <ChevronDown size={16} className="text-neutral-400" />
                        </div>
                      </div>
                    </div>
                    <Input
                      label="Website"
                      type="url"
                      value={newCompany.website}
                      onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Annual Revenue
                      </label>
                      <div className="relative">
                        <select
                          value={newCompany.annual_revenue}
                          onChange={(e) => setNewCompany({ ...newCompany, annual_revenue: e.target.value })}
                          className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
                        >
                          <option value="">Select revenue range...</option>
                          {revenueRanges.map((range) => (
                            <option key={range} value={range}>{range}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <ChevronDown size={16} className="text-neutral-400" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Employee Count
                      </label>
                      <div className="relative">
                        <select
                          value={newCompany.employee_count}
                          onChange={(e) => setNewCompany({ ...newCompany, employee_count: e.target.value })}
                          className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
                        >
                          <option value="">Select employee range...</option>
                          {employeeRanges.map((range) => (
                            <option key={range} value={range}>{range}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <ChevronDown size={16} className="text-neutral-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newCompany.description}
                      onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      rows={3}
                    />
                  </div>

                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        value={newCompany.status}
                        onChange={(e) => setNewCompany({ ...newCompany, status: e.target.value as typeof companyStatuses[number] })}
                        className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
                      >
                        {companyStatuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <ChevronDown size={16} className="text-neutral-400" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-6">
                    <label className="block text-sm font-medium text-neutral-700 mb-4">
                      Social Media Links
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <Linkedin className="w-5 h-5 text-[#0077B5]" />
                        <Input
                          placeholder="LinkedIn URL"
                          value={newCompany.social_links.linkedin}
                          onChange={(e) => setNewCompany({
                            ...newCompany,
                            social_links: { ...newCompany.social_links, linkedin: e.target.value }
                          })}
                          fullWidth
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                        <Input
                          placeholder="X (Twitter) URL"
                          value={newCompany.social_links.twitter}
                          onChange={(e) => setNewCompany({
                            ...newCompany,
                            social_links: { ...newCompany.social_links, twitter: e.target.value }
                          })}
                          fullWidth
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <Facebook className="w-5 h-5 text-[#4267B2]" />
                        <Input
                          placeholder="Facebook URL"
                          value={newCompany.social_links.facebook}
                          onChange={(e) => setNewCompany({
                            ...newCompany,
                            social_links: { ...newCompany.social_links, facebook: e.target.value }
                          })}
                          
                          fullWidth
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <Instagram className="w-5 h-5 text-[#E4405F]" />
                        <Input
                          placeholder="Instagram URL"
                          value={newCompany.social_links.instagram}
                          onChange={(e) => setNewCompany({
                            ...newCompany,
                            social_links: { ...newCompany.social_links, instagram: e.target.value }
                          })}
                          fullWidth
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForms();
                  }}
                  size="lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddItem}
                  size="lg"
                  disabled={
                    isSaving ||
                    (activeView === 'contacts'
                      ? !newContact.first_name || !newContact.last_name || !newContact.email
                      :!newCompany.name)
                  }
                >
                  {isSaving ? 'Saving...' : `Add ${activeView === 'contacts' ? 'Contact' : 'Company'}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;