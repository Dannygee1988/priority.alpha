import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PlusCircle, Trash2 } from 'lucide-react';

interface Insider {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name?: string;
  type: string;
}

const Insiders = () => {
  const [insiders, setInsiders] = useState<Insider[]>([]);
  const [loading, setLoading] = useState(true);
  const [newInsider, setNewInsider] = useState<Partial<Insider>>({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    type: 'Staff'
  });

  useEffect(() => {
    fetchInsiders();
  }, []);

  const fetchInsiders = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInsiders(data || []);
    } catch (error) {
      console.error('Error fetching insiders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewInsider(prev => ({ ...prev, [name]: value }));
  };

  const handleAddInsider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('crm_customers')
        .insert([newInsider])
        .select();

      if (error) throw error;

      setInsiders(prev => [...prev, ...(data || [])]);
      setNewInsider({
        first_name: '',
        last_name: '',
        email: '',
        company_name: '',
        type: 'Staff'
      });
    } catch (error) {
      console.error('Error adding insider:', error);
    }
  };

  const handleDeleteInsider = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crm_customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setInsiders(prev => prev.filter(insider => insider.id !== id));
    } catch (error) {
      console.error('Error deleting insider:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Manage Insiders</h1>
        <form onSubmit={handleAddInsider} className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="First Name"
              name="first_name"
              value={newInsider.first_name}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Last Name"
              name="last_name"
              value={newInsider.last_name}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Email"
              type="email"
              name="email"
              value={newInsider.email}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Company Name"
              name="company_name"
              value={newInsider.company_name}
              onChange={handleInputChange}
            />
            <div className="flex flex-col">
              <label className="mb-2 text-sm font-medium text-gray-700">Type</label>
              <select
                name="type"
                value={newInsider.type}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="Staff">Staff</option>
                <option value="Advisor">Advisor</option>
                <option value="Investor">Investor</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <Button type="submit" className="mt-4">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Insider
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {insiders.map(insider => (
              <tr key={insider.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {insider.first_name} {insider.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{insider.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{insider.company_name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{insider.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteInsider(insider.id)}
                    className="text-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Insiders;