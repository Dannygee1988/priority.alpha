import React, { useState, useEffect } from 'react';
import { Phone, Upload, Plus, X, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VoxOutboundCall } from '../types';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

interface PhoneNumber {
  id: string;
  number: string;
  isValid: boolean;
  error?: string;
}

const VoxOutbound: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [currentNumber, setCurrentNumber] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agentId, setAgentId] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchAgentId();
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
    if (!currentNumber.trim()) return;

    const validation = validatePhoneNumber(currentNumber);
    const isDuplicate = phoneNumbers.some(p => p.number === currentNumber.trim());

    if (isDuplicate) {
      setMessage({ type: 'error', text: 'This number is already in the list' });
      return;
    }

    const newPhone: PhoneNumber = {
      id: Math.random().toString(36).substr(2, 9),
      number: currentNumber.trim(),
      isValid: validation.isValid,
      error: validation.error
    };

    setPhoneNumbers([...phoneNumbers, newPhone]);
    setCurrentNumber('');
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

      const newNumbers: PhoneNumber[] = [];
      const existingNumbers = new Set(phoneNumbers.map(p => p.number));

      lines.forEach((line, index) => {
        const cells = line.split(',').map(cell => cell.trim().replace(/['"]/g, ''));
        const number = cells[0];

        if (number && !existingNumbers.has(number)) {
          const validation = validatePhoneNumber(number);
          newNumbers.push({
            id: `${Date.now()}-${index}`,
            number,
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
        call_status: 'queued',
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
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Phone Number
                </label>
                <div className="flex gap-3">
                  <input
                    type="tel"
                    value={currentNumber}
                    onChange={(e) => setCurrentNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPhoneNumber()}
                    placeholder="Enter phone number (e.g., +1234567890)"
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent"
                  />
                  <Button onClick={addPhoneNumber}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Number
                  </Button>
                </div>
                <p className="mt-2 text-sm text-neutral-500">
                  Enter phone numbers with country code (e.g., +1 for US)
                </p>
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
                    CSV file with phone numbers in the first column
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
                Phone Numbers ({phoneNumbers.length})
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
                  <div className="flex items-center gap-3 flex-1">
                    <Phone className={`w-4 h-4 ${phone.isValid ? 'text-green-600' : 'text-red-600'}`} />
                    <span className="font-mono text-neutral-800">{phone.number}</span>
                    {!phone.isValid && phone.error && (
                      <span className="text-sm text-red-600">({phone.error})</span>
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
    </div>
  );
};

export default VoxOutbound;
