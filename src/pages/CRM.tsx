import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Mail, Phone, Building2, UserRound } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getCustomers, getUserCompany, addCustomer } from '../lib/api';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  job_title: string | null;
  status: 'prospect' | 'lead' | 'customer' | 'inactive';
  source: string | null;
  last_contacted: string | null;
  created_at: string;
}

const CRM: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    job_title: '',
    status: 'prospect' as const,
    source: '',
    notes: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, [user]);

  const loadCustomers = async () => {
    if (!user?.id) return;
    
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        console.warn('No company found for user');
        setIsLoading(false);
        return;
      }

      const data = await getCustomers(companyId);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('Failed to load customers. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!user?.id) return;
    
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        setError('No company found for user');
        return;
      }

      await addCustomer({
        company_id: companyId,
        ...newCustomer,
        tags: [],
        custom_fields: {}
      });

      setShowAddModal(false);
      setNewCustomer({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_name: '',
        job_title: '',
        status: 'prospect',
        source: '',
        notes: ''
      });
      
      loadCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      setError('Failed to add customer. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospect':
        return 'bg-neutral-100 text-neutral-700';
      case 'lead':
        return 'bg-primary-50 text-primary-700';
      case 'customer':
        return 'bg-success-50 text-success-700';
      case 'inactive':
        return 'bg-error-50 text-error-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const filteredCustomers = customers.filter(customer =>
    `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Customer Relationship Management</h1>
        <p className="text-neutral-500">Manage your customer relationships and track interactions</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search customers..."
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
                Add Customer
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
          ) : filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Company</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Last Contacted</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <UserRound size={16} />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-neutral-900">
                              {customer.first_name} {customer.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-neutral-600">
                            <Mail size={14} className="mr-1" />
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center text-sm text-neutral-600">
                              <Phone size={14} className="mr-1" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {customer.company_name && (
                          <div className="flex items-center text-sm text-neutral-600">
                            <Building2 size={14} className="mr-1" />
                            {customer.company_name}
                            {customer.job_title && (
                              <span className="text-neutral-400 ml-1">
                                ({customer.job_title})
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-600">
                        {customer.last_contacted
                          ? new Date(customer.last_contacted).toLocaleDateString()
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
              <p className="text-neutral-500">No customers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-8">
            <div className="p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-neutral-800 mb-4">Add New Customer</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={newCustomer.first_name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={newCustomer.last_name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                    required
                  />
                </div>
                
                <Input
                  label="Email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  required
                />
                
                <Input
                  label="Phone"
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
                
                <Input
                  label="Company Name"
                  value={newCustomer.company_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, company_name: e.target.value })}
                />
                
                <Input
                  label="Job Title"
                  value={newCustomer.job_title}
                  onChange={(e) => setNewCustomer({ ...newCustomer, job_title: e.target.value })}
                />
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Status
                  </label>
                  <select
                    value={newCustomer.status}
                    onChange={(e) => setNewCustomer({ ...newCustomer, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="prospect">Prospect</option>
                    <option value="lead">Lead</option>
                    <option value="customer">Customer</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <Input
                  label="Source"
                  value={newCustomer.source}
                  onChange={(e) => setNewCustomer({ ...newCustomer, source: e.target.value })}
                />
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary h-24 resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCustomer}
                >
                  Add Customer
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