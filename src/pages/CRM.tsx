import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Mail, Phone, Building2, UserRound, ChevronDown, Globe, MapPin, Users, DollarSign, Briefcase, X } from 'lucide-react';
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
  linkedin_url: string | null;
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
  const [isSaving, setIsSaving] = useState(false);

  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    job_title: '',
    type: 'Customer' as const,
    linkedin_url: '',
    crm_company_id: '' as string | null
  });

  const [newCompany, setNewCompany] = useState({
    name: '',
    industry: '',
    website: '',
    description: '',
    annual_revenue: '' as string | number,
    employee_count: '' as string | number,
    status: 'active' as const
  });

  const contactTypes = ['Staff', 'Customer', 'Investor', 'Lead', 'Advisor', 'Other'] as const;
  const contactStatuses = ['prospect', 'lead', 'customer', 'inactive'] as const;
  const companyStatuses = ['active', 'inactive', 'lead', 'prospect'] as const;

  useEffect(() => {
    loadData();
  }, [user, activeView]);

  // ... rest of the component implementation remains exactly the same until the modal ...

  {showAddModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-neutral-800">Add Contact</h2>
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
                <select
                  value={newContact.crm_company_id || ''}
                  onChange={(e) => setNewContact({ ...newContact, crm_company_id: e.target.value || null })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="">No company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Job Title"
                value={newContact.job_title}
                onChange={(e) => setNewContact({ ...newContact, job_title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Type
                </label>
                <select
                  value={newContact.type}
                  onChange={(e) => setNewContact({ ...newContact, type: e.target.value as typeof contactTypes[number] })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {contactTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <Input
                label="LinkedIn URL"
                type="url"
                value={newContact.linkedin_url}
                onChange={(e) => setNewContact({ ...newContact, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </div>

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
              disabled={!newContact.first_name || !newContact.last_name || !newContact.email}
            >
              Add Contact
            </Button>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Rest of the component remains exactly the same... */}
};

export default CRM;