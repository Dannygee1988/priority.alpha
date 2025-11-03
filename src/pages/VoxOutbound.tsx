import React, { useState, useEffect } from 'react';
import { Phone, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VoxOutboundCall } from '../types';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

interface ContactData {
  id: string;
  number: string;
  name: string;
  email?: string;
  address?: string;
  isValid: boolean;
  error?: string;
}

const VoxOutbound: React.FC = () => {
  const { user } = useAuth();
  const [phoneNumbers, setPhoneNumbers] = useState<ContactData[]>([]);
  const [currentNumber, setCurrentNumber] = useState('+44');
  const [currentName, setCurrentName] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [agentId, setAgentId] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [queuedCalls, setQueuedCalls] = useState<VoxOutboundCall[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAgentId();
      fetchQueuedCalls();
    }
  }, [user]);

  const fetchAgentId = async () => {
    if (!user) return;

    try {
      const { data: userCompanies, error: userCompaniesError } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userCompaniesError) {
        console.error('Error fetching user companies:', userCompaniesError);
        setMessage({ type: 'error', text: 'Failed to load company information. Please try refreshing the page.' });
        return;
      }

      if (!userCompanies || userCompanies.length === 0) {
        setMessage({ type: 'error', text: 'No company association found. Please contact support.' });
        return;
      }

      const companyIds = userCompanies.map(uc => uc.company_id);

      const { data: companies, error: companiesError } = await supabase
        .from('company_profiles')
        .select('vox_agent_id')
        .in('id', companyIds);

      if (companiesError) {
        console.error('Error fetching company profiles:', companiesError);
        setMessage({ type: 'error', text: 'Failed to load company profile. Please try refreshing the page.' });
        return;
      }

      if (companies && companies.length > 0) {
        const companyWithAgent = companies.find(c => c.vox_agent_id);
        if (companyWithAgent?.vox_agent_id) {
          setAgentId(companyWithAgent.vox_agent_id);
        } else {
          setMessage({ type: 'error', text: 'Agent ID not found. Please ensure your company profile is set up.' });
        }
      } else {
        setMessage({ type: 'error', text: 'No company profiles found. Please contact support.' });
      }
    } catch (error) {
      console.error('Error fetching agent ID:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try refreshing the page.' });
    }
  };

  const fetchQueuedCalls = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: userCompanies, error: userCompaniesError } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id);

      if (userCompaniesError) throw userCompaniesError;

      if (!userCompanies || userCompanies.length === 0) {
        setQueuedCalls([]);
        setLoading(false);
        return;
      }

      const companyIds = userCompanies.map(uc => uc.company_id);

      const { data: companies, error: companiesError } = await supabase
        .from('company_profiles')
        .select('vox_agent_id')
        .in('id', companyIds);

      if (companiesError) throw companiesError;

      const agentIds = companies
        ?.map(c => c.vox_agent_id)
        .filter(id => id != null) || [];

      if (agentIds.length === 0) {
        setQueuedCalls([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('vox_outbound_calls')
        .select('*')
        .in('agent_id', agentIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQueuedCalls(data || []);
    } catch (error) {
      console.error('Error fetching queued calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = (number: string): { isValid: boolean; error?: string } => {
    const cleaned = number.replace(/\D/g, '');

    if (cleaned.length === 0) {
      return { isValid: false, error: 'Phone number is required' };
    }

    if (cleaned.length < 10 || cleaned.length > 15) {
      return { isValid: false, error: 'Invalid phone number length' };
    }

    return { isValid: true };
  };

  const addPhoneNumber = () => {
    if (!currentNumber.trim() || currentNumber === '+44') {
      setMessage({ type: 'error', text: 'Phone number is required' });
      return;
    }

    if (!currentName.trim()) {
      setMessage({ type: 'error', text: 'Caller name is required' });
      return;
    }

    if (phoneNumbers.length >= 10) {
      setMessage({ type: 'error', text: 'Maximum of 10 calls can be added at once' });
      return;
    }

    const validation = validatePhoneNumber(currentNumber);
    const isDuplicate = phoneNumbers.some(p => p.number === currentNumber.trim());

    if (isDuplicate) {
      setMessage({ type: 'error', text: 'This number is already in the list' });
      return;
    }

    const newContact: ContactData = {
      id: Math.random().toString(36).substr(2, 9),
      number: currentNumber.trim(),
      name: currentName.trim(),
      email: currentEmail.trim() || undefined,
      address: currentAddress.trim() || undefined,
      isValid: validation.isValid,
      error: validation.error
    };

    setPhoneNumbers([...phoneNumbers, newContact]);
    setCurrentNumber('+44');
    setCurrentName('');
    setCurrentEmail('');
    setCurrentAddress('');
    setMessage(null);
  };

  const removePhoneNumber = (id: string) => {
    setPhoneNumbers(phoneNumbers.filter(p => p.id !== id));
  };

  const submitCalls = async () => {
    if (!user || !agentId) {
      setMessage({ type: 'error', text: 'Agent ID not found. Please ensure your company profile is set up.' });
      return;
    }

    const validNumbers = phoneNumbers.filter(p => p.isValid);
    if (validNumbers.length === 0) {
      setMessage({ type: 'error', text: 'No valid phone numbers to submit' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const callsToInsert = validNumbers.map(phone => ({
        user_id: user.id,
        agent_id: agentId,
        phone_number: phone.number,
        caller_name: phone.name,
        caller_email: phone.email || null,
        caller_address: phone.address || null,
        call_status: 'queued',
        call_duration: 0,
        cost: 0
      }));

      const { data: insertedCalls, error } = await supabase
        .from('vox_outbound_calls')
        .insert(callsToInsert)
        .select();

      if (error) throw error;

      if (insertedCalls && insertedCalls.length > 0) {
        try {
          const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vox-outbound-webhook`;
          await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ calls: insertedCalls }),
          });
        } catch (webhookError) {
          console.error('Failed to send webhook:', webhookError);
        }
      }

      setMessage({ type: 'success', text: `Successfully queued ${validNumbers.length} calls` });
      setPhoneNumbers([]);
      await fetchQueuedCalls();
    } catch (error) {
      console.error('Error submitting calls:', error);
      setMessage({ type: 'error', text: 'Failed to queue calls. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = phoneNumbers.filter(p => p.isValid).length;
  const invalidCount = phoneNumbers.length - validCount;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">Vox Outbound</h1>
        <p className="text-neutral-600">Schedule outbound calls by adding phone numbers manually.</p>
      </div>

      <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Important Information</p>
          <p>
            Pri0r1ty Vox should only be used for consented outbound calling and in the normal course of your business.
            Outbound calling is only available during the working hours of 9am - 5pm Monday - Friday (including bank holidays).
            Batch calls will be scheduled and processed at regular intervals based on your Vox subscription concurrency.
            Vox is designed to maximise your outbound calling success using AI so will always adhere to data compliance and telephone compliance rules.
          </p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="border-b border-neutral-200">
          <div className="flex">
            <div className="px-6 py-4 text-sm font-medium text-neutral-800 border-b-2 border-neutral-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Manual Entry
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={currentNumber}
                    onChange={(e) => setCurrentNumber(e.target.value)}
                    placeholder="+44 7123 456789"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Caller Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={currentEmail}
                    onChange={(e) => setCurrentEmail(e.target.value)}
                    placeholder="john.smith@example.com"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    placeholder="123 Main St, London, UK"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={addPhoneNumber}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </div>
        </div>
      </div>

      {phoneNumbers.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800">
                Contacts ({phoneNumbers.length})
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  {validCount} valid
                </span>
                {invalidCount > 0 && (
                  <span className="text-red-600 font-medium">
                    {invalidCount} invalid
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="divide-y divide-neutral-200">
              {phoneNumbers.map((phone) => (
                <div
                  key={phone.id}
                  className="px-6 py-3 flex items-center justify-between hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Phone className={`w-4 h-4 flex-shrink-0 ${phone.isValid ? 'text-green-600' : 'text-red-600'}`} />
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <div>
                        <span className="text-xs text-neutral-500 block">Phone</span>
                        <span className="font-mono text-sm text-neutral-800">{phone.number}</span>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">Name</span>
                        <span className="text-sm text-neutral-800">{phone.name}</span>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">Email</span>
                        <span className="text-sm text-neutral-800">{phone.email || '-'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">Address</span>
                        <span className="text-sm text-neutral-800 truncate">{phone.address || '-'}</span>
                      </div>
                    </div>
                    {!phone.isValid && phone.error && (
                      <span className="text-sm text-red-600 flex-shrink-0">({phone.error})</span>
                    )}
                  </div>
                  <button
                    onClick={() => removePhoneNumber(phone.id)}
                    className="text-neutral-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-600">
                {validCount > 0 ? `${validCount} call${validCount !== 1 ? 's' : ''} will be queued` : 'No valid numbers to queue'}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPhoneNumbers([])}
                >
                  Clear All
                </Button>
                <Button
                  onClick={submitCalls}
                  disabled={validCount === 0 || submitting}
                >
                  {submitting ? 'Queueing...' : `Queue ${validCount} Call${validCount !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-800">
            Queued Calls ({queuedCalls.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-neutral-500">
            Loading calls...
          </div>
        ) : queuedCalls.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            No calls queued yet. Add contacts above to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {queuedCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        call.call_status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : call.call_status === 'queued'
                          ? 'bg-blue-50 text-blue-700'
                          : call.call_status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {call.call_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                      {call.caller_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-neutral-800">
                      {call.phone_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {call.caller_email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {new Date(call.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoxOutbound;
