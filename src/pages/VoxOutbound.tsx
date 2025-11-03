import React, { useState, useEffect } from 'react';
import { Phone, Upload, Plus, X, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  const [phoneNumbers, setPhoneNumbers] = useState<ContactData[]>([]);
  const [currentNumber, setCurrentNumber] = useState('+44');
  const [currentName, setCurrentName] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [uploading, setUploading] = useState(false);
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
      const { data: userCompanies } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id);

      if (!userCompanies || userCompanies.length === 0) return;

      const companyIds = userCompanies.map(uc => uc.company_id);

      const { data: companies } = await supabase
        .from('company_profiles')
        .select('vox_agent_id')
        .in('id', companyIds);

      if (companies && companies.length > 0 && companies[0].vox_agent_id) {
        setAgentId(companies[0].vox_agent_id);
      }
    } catch (error) {
      console.error('Error fetching agent ID:', error);
    }
  };

  const fetchQueuedCalls = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vox_outbound_calls')
        .select('*')
        .eq('user_id', user.id)
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());

      const newNumbers: ContactData[] = [];
      const existingNumbers = new Set(phoneNumbers.map(p => p.number));

      lines.forEach((line, index) => {
        const cells = line.split(',').map(cell => cell.trim().replace(/['"]/g, ''));
        const number = cells[0];
        const name = cells[1];
        const email = cells[2];
        const address = cells[3];

        if (number && name && !existingNumbers.has(number)) {
          const validation = validatePhoneNumber(number);
          newNumbers.push({
            id: `${Date.now()}-${index}`,
            number,
            name,
            email: email || undefined,
            address: address || undefined,
            isValid: validation.isValid,
            error: validation.error
          });
          existingNumbers.add(number);
        }
      });

      setPhoneNumbers([...phoneNumbers, ...newNumbers]);
      setMessage({ type: 'success', text: `Added ${newNumbers.length} phone numbers` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to parse file. Please use a CSV format.' });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
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
        status: 'Waiting',
        call_duration: 0,
        cost: 0,
        started_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('vox_outbound_calls')
        .insert(callsToInsert);

      if (error) throw error;

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
        <p className="text-neutral-600">Schedule outbound calls by adding phone numbers manually or uploading a CSV file.</p>
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
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'text-neutral-800 border-b-2 border-neutral-800'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Manual Entry
              </div>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'text-neutral-800 border-b-2 border-neutral-800'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload CSV
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'manual' ? (
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
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Upload CSV File
                </label>
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-neutral-400 transition-colors">
                  <FileSpreadsheet className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <label className="cursor-pointer">
                    <span className="text-neutral-600">
                      Click to upload or drag and drop
                    </span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-2 text-sm text-neutral-500">
                    CSV format: Phone Number, Name, Email, Address
                  </p>
                </div>
              </div>
            </div>
          )}
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
                    Call Status
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
                        call.status === 'Complete'
                          ? 'bg-green-100 text-green-800'
                          : call.status === 'Waiting'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {call.status}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${
                        call.call_status === 'completed'
                          ? 'text-green-600'
                          : call.call_status === 'failed'
                          ? 'text-red-600'
                          : 'text-neutral-600'
                      }`}>
                        {call.call_status}
                      </span>
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
