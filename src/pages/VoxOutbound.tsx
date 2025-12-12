import React, { useState, useEffect } from 'react';
import { Phone, Plus, X, AlertCircle, CheckCircle, Upload, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VoxOutboundCall } from '../types';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

interface ContactData {
  id: string;
  number: string;
  firstName: string;
  lastName: string;
  email?: string;
  street?: string;
  city?: string;
  postCode?: string;
  additionalInformation?: string;
  lastContacted?: string;
  isValid: boolean;
  error?: string;
}

const VoxOutbound: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk' | 'manualUpload'>('manual');
  const [phoneNumbers, setPhoneNumbers] = useState<ContactData[]>([]);
  const [currentNumber, setCurrentNumber] = useState('+44');
  const [currentFirstName, setCurrentFirstName] = useState('');
  const [currentLastName, setCurrentLastName] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentStreet, setCurrentStreet] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [currentPostCode, setCurrentPostCode] = useState('');
  const [currentAdditionalInfo, setCurrentAdditionalInfo] = useState('');
  const [currentLastContacted, setCurrentLastContacted] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [agentId, setAgentId] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [queuedCalls, setQueuedCalls] = useState<VoxOutboundCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedContacts, setUploadedContacts] = useState<ContactData[]>([]);
  const [manualUploadFile, setManualUploadFile] = useState<File | null>(null);
  const [manualUploadNotes, setManualUploadNotes] = useState('');

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
        .eq('call_status', 'queued')
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

    if (!currentFirstName.trim()) {
      setMessage({ type: 'error', text: 'First name is required' });
      return;
    }

    if (!currentLastName.trim()) {
      setMessage({ type: 'error', text: 'Last name is required' });
      return;
    }

    if (!currentStreet.trim()) {
      setMessage({ type: 'error', text: 'Street is required' });
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
      firstName: currentFirstName.trim(),
      lastName: currentLastName.trim(),
      email: currentEmail.trim() || undefined,
      street: currentStreet.trim() || undefined,
      city: currentCity.trim() || undefined,
      postCode: currentPostCode.trim() || undefined,
      additionalInformation: currentAdditionalInfo.trim() || undefined,
      lastContacted: currentLastContacted.trim() || undefined,
      isValid: validation.isValid,
      error: validation.error
    };

    setPhoneNumbers([...phoneNumbers, newContact]);
    setCurrentNumber('+44');
    setCurrentFirstName('');
    setCurrentLastName('');
    setCurrentEmail('');
    setCurrentStreet('');
    setCurrentCity('');
    setCurrentPostCode('');
    setCurrentAdditionalInfo('');
    setCurrentLastContacted('');
    setMessage(null);
  };

  const removePhoneNumber = (id: string) => {
    setPhoneNumbers(phoneNumbers.filter(p => p.id !== id));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'Please upload a CSV file' });
      return;
    }

    setUploadedFile(file);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      setMessage({ type: 'error', text: 'CSV file is empty' });
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const dataLines = lines.slice(1);

    if (dataLines.length > 10) {
      setMessage({ type: 'error', text: 'Maximum of 10 records allowed. Please reduce the number of entries.' });
      return;
    }

    const contacts: ContactData[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const values = dataLines[i].split(',').map(v => v.trim());

      const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('number'));
      const firstNameIndex = headers.findIndex(h => h.includes('first') && h.includes('name'));
      const lastNameIndex = headers.findIndex(h => h.includes('last') && h.includes('name'));
      const emailIndex = headers.findIndex(h => h.includes('email'));
      const streetIndex = headers.findIndex(h => h.includes('street') || h.includes('address'));
      const cityIndex = headers.findIndex(h => h.includes('city'));
      const postCodeIndex = headers.findIndex(h => h.includes('postcode') || h.includes('post') || h.includes('zip'));
      const additionalInfoIndex = headers.findIndex(h => h.includes('additional') || h.includes('notes') || h.includes('info'));
      const lastContactedIndex = headers.findIndex(h => h.includes('last') && h.includes('contact'));

      const phoneNumber = phoneIndex >= 0 ? values[phoneIndex] : '';
      const firstName = firstNameIndex >= 0 ? values[firstNameIndex] : '';
      const lastName = lastNameIndex >= 0 ? values[lastNameIndex] : '';
      const street = streetIndex >= 0 ? values[streetIndex] : '';

      if (!phoneNumber || !firstName || !lastName || !street) {
        continue;
      }

      const validation = validatePhoneNumber(phoneNumber);

      contacts.push({
        id: Math.random().toString(36).substr(2, 9),
        number: phoneNumber,
        firstName: firstName,
        lastName: lastName,
        street: street,
        email: emailIndex >= 0 ? values[emailIndex] : undefined,
        city: cityIndex >= 0 ? values[cityIndex] : undefined,
        postCode: postCodeIndex >= 0 ? values[postCodeIndex] : undefined,
        additionalInformation: additionalInfoIndex >= 0 ? values[additionalInfoIndex] : undefined,
        lastContacted: lastContactedIndex >= 0 ? values[lastContactedIndex] : undefined,
        isValid: validation.isValid,
        error: validation.error
      });
    }

    if (contacts.length === 0) {
      setMessage({ type: 'error', text: 'No valid contacts found in CSV. Ensure headers include: phone_number, first_name, last_name, street' });
      return;
    }

    setUploadedContacts(contacts);
    setMessage({ type: 'success', text: `Successfully loaded ${contacts.length} contact${contacts.length !== 1 ? 's' : ''} from CSV` });
  };

  const clearBulkUpload = () => {
    setUploadedFile(null);
    setUploadedContacts([]);
    setMessage(null);
  };

  const handleManualUploadFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'Please upload a CSV file' });
      return;
    }

    setManualUploadFile(file);
    setMessage({ type: 'success', text: `File "${file.name}" ready to upload` });
  };


  const clearManualUpload = () => {
    setManualUploadFile(null);
    setManualUploadNotes('');
    setMessage(null);
  };

  const submitManualUpload = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to submit manual uploads' });
      return;
    }

    if (!manualUploadFile) {
      setMessage({ type: 'error', text: 'Please select a CSV file to upload' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const { data: userCompanies, error: userCompaniesError } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userCompaniesError) throw userCompaniesError;

      const companyId = userCompanies && userCompanies.length > 0 ? userCompanies[0].company_id : null;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = (e.target?.result as string).split(',')[1];

        try {
          await fetch('https://n8n.srv997647.hstgr.cloud/webhook/5b3efc91-0449-41e1-be28-302f03e67865', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              company_id: companyId,
              file_name: manualUploadFile.name,
              data: base64Data,
              notes: manualUploadNotes.trim() || null,
              submitted_at: new Date().toISOString()
            }),
          });

          setMessage({
            type: 'success',
            text: `Successfully submitted ${manualUploadFile.name} for manual processing by Pri0r1ty`
          });
          clearManualUpload();
        } catch (webhookError) {
          console.error('Failed to send webhook:', webhookError);
          setMessage({ type: 'error', text: 'Failed to send file to webhook. Please try again.' });
        } finally {
          setSubmitting(false);
        }
      };

      reader.onerror = () => {
        setMessage({ type: 'error', text: 'Failed to read file. Please try again.' });
        setSubmitting(false);
      };

      reader.readAsDataURL(manualUploadFile);
    } catch (error) {
      console.error('Error submitting manual upload:', error);
      setMessage({ type: 'error', text: 'Failed to submit manual upload. Please try again.' });
      setSubmitting(false);
    }
  };

  const submitBulkCalls = async () => {
    if (!user || !agentId) {
      setMessage({ type: 'error', text: 'Agent ID not found. Please ensure your company profile is set up.' });
      return;
    }

    const validNumbers = uploadedContacts.filter(p => p.isValid);
    if (validNumbers.length === 0) {
      setMessage({ type: 'error', text: 'No valid phone numbers to submit' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const callsToInsert = validNumbers.map(phone => {
        let lastContactedValue = null;
        if (phone.lastContacted && phone.lastContacted.trim()) {
          const date = new Date(phone.lastContacted);
          if (!isNaN(date.getTime())) {
            lastContactedValue = date.toISOString();
          }
        }

        return {
          user_id: user.id,
          agent_id: agentId,
          phone_number: phone.number,
          name: phone.firstName,
          last_name: phone.lastName,
          caller_email: phone.email || null,
          street: phone.street || null,
          city: phone.city || null,
          post_code: phone.postCode || null,
          reason_for_sale: phone.additionalInformation || null,
          last_contacted: lastContactedValue,
          call_status: 'queued',
          call_duration: 0,
          cost: 0
        };
      });

      const { data: insertedCalls, error } = await supabase
        .from('vox_outbound_calls')
        .insert(callsToInsert)
        .select();

      if (error) throw error;

      if (insertedCalls && insertedCalls.length > 0) {
        const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vox-outbound-webhook`;

        for (const call of insertedCalls) {
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ call }),
            });
          } catch (webhookError) {
            console.error('Failed to send webhook for call:', call.id, webhookError);
          }
        }
      }

      setMessage({ type: 'success', text: `Successfully queued ${validNumbers.length} calls` });
      clearBulkUpload();
      await fetchQueuedCalls();
    } catch (error) {
      console.error('Error submitting calls:', error);
      setMessage({ type: 'error', text: 'Failed to queue calls. Please try again.' });
    } finally {
      setSubmitting(false);
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
      const callsToInsert = validNumbers.map(phone => {
        let lastContactedValue = null;
        if (phone.lastContacted && phone.lastContacted.trim()) {
          const date = new Date(phone.lastContacted);
          if (!isNaN(date.getTime())) {
            lastContactedValue = date.toISOString();
          }
        }

        return {
          user_id: user.id,
          agent_id: agentId,
          phone_number: phone.number,
          name: phone.firstName,
          last_name: phone.lastName,
          caller_email: phone.email || null,
          street: phone.street || null,
          city: phone.city || null,
          post_code: phone.postCode || null,
          reason_for_sale: phone.additionalInformation || null,
          last_contacted: lastContactedValue,
          call_status: 'queued',
          call_duration: 0,
          cost: 0
        };
      });

      const { data: insertedCalls, error } = await supabase
        .from('vox_outbound_calls')
        .insert(callsToInsert)
        .select();

      if (error) throw error;

      if (insertedCalls && insertedCalls.length > 0) {
        const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vox-outbound-webhook`;

        for (const call of insertedCalls) {
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ call }),
            });
          } catch (webhookError) {
            console.error('Failed to send webhook for call:', call.id, webhookError);
          }
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
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'text-neutral-800 border-b-2 border-neutral-800'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Manual Entry
              </div>
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'bulk'
                  ? 'text-neutral-800 border-b-2 border-neutral-800'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Bulk Upload
              </div>
            </button>
            <button
              onClick={() => setActiveTab('manualUpload')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'manualUpload'
                  ? 'text-neutral-800 border-b-2 border-neutral-800'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Manual Upload
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
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
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentFirstName}
                    onChange={(e) => setCurrentFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentLastName}
                    onChange={(e) => setCurrentLastName(e.target.value)}
                    placeholder="Smith"
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
                    Last Contacted
                  </label>
                  <input
                    type="date"
                    value={currentLastContacted}
                    onChange={(e) => setCurrentLastContacted(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Street <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentStreet}
                    onChange={(e) => setCurrentStreet(e.target.value)}
                    placeholder="123 Main St"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={currentCity}
                    onChange={(e) => setCurrentCity(e.target.value)}
                    placeholder="London"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Post Code
                  </label>
                  <input
                    type="text"
                    value={currentPostCode}
                    onChange={(e) => setCurrentPostCode(e.target.value)}
                    placeholder="SW1A 1AA"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  value={currentAdditionalInfo}
                  onChange={(e) => setCurrentAdditionalInfo(e.target.value)}
                  placeholder="Any additional notes or context about this contact..."
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={addPhoneNumber}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'bulk' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <Upload className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
                <h3 className="text-lg font-medium text-neutral-800 mb-2">Upload CSV File</h3>
                <p className="text-sm text-neutral-600 mb-6">
                  Upload a CSV file with up to 10 contacts. Required columns: phone_number, first_name, last_name, street
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-md font-medium cursor-pointer hover:bg-neutral-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Choose CSV File
                </label>
                {uploadedFile && (
                  <p className="mt-4 text-sm text-neutral-600">
                    Uploaded: <span className="font-medium">{uploadedFile.name}</span>
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">CSV Format Guide:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Required columns: phone_number, first_name, last_name, street</li>
                  <li>Optional columns: email, city, postcode, additional_information, last_contacted</li>
                  <li>Maximum 10 records per upload</li>
                  <li>Phone numbers should include country code (e.g., +447123456789)</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'manualUpload' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
                <h3 className="text-lg font-medium text-neutral-800 mb-2">Upload CSV for Manual Processing</h3>
                <p className="text-sm text-neutral-600 mb-6">
                  Upload a CSV file with any number of contacts. Pri0r1ty will process this manually.
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleManualUploadFileUpload}
                  className="hidden"
                  id="manual-csv-upload"
                />
                <label
                  htmlFor="manual-csv-upload"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-md font-medium cursor-pointer hover:bg-neutral-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Choose CSV File
                </label>
                {manualUploadFile && (
                  <p className="mt-4 text-sm text-neutral-600">
                    Selected: <span className="font-medium">{manualUploadFile.name}</span>
                  </p>
                )}
              </div>

              {manualUploadFile && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={manualUploadNotes}
                      onChange={(e) => setManualUploadNotes(e.target.value)}
                      placeholder="Add any additional notes or instructions for Pri0r1ty..."
                      rows={4}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={clearManualUpload}>
                      Cancel
                    </Button>
                    <Button onClick={submitManualUpload} disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit to Pri0r1ty'}
                    </Button>
                  </div>
                </>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">Manual Upload Information:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Upload any CSV file - no specific format required</li>
                  <li>No limit on number of records</li>
                  <li>File will be sent to Pri0r1ty for manual processing</li>
                  <li>These contacts will NOT be automatically queued for calling</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {((activeTab === 'manual' && phoneNumbers.length > 0) ||
        (activeTab === 'bulk' && uploadedContacts.length > 0)) && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800">
                Contacts ({
                  activeTab === 'manual' ? phoneNumbers.length :
                  uploadedContacts.length
                })
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  {activeTab === 'manual' ? validCount :
                   uploadedContacts.filter(p => p.isValid).length} valid
                </span>
                {((activeTab === 'manual' && invalidCount > 0) ||
                  (activeTab === 'bulk' && uploadedContacts.length - uploadedContacts.filter(p => p.isValid).length > 0)) && (
                  <span className="text-red-600 font-medium">
                    {activeTab === 'manual' ? invalidCount :
                     uploadedContacts.length - uploadedContacts.filter(p => p.isValid).length} invalid
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="divide-y divide-neutral-200">
              {(activeTab === 'manual' ? phoneNumbers : uploadedContacts).map((phone) => (
                <div
                  key={phone.id}
                  className="px-6 py-3 flex items-center justify-between hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Phone className={`w-4 h-4 flex-shrink-0 ${phone.isValid ? 'text-green-600' : 'text-red-600'}`} />
                    <div className="flex-1 grid grid-cols-5 gap-4">
                      <div>
                        <span className="text-xs text-neutral-500 block">Phone</span>
                        <span className="font-mono text-sm text-neutral-800">{phone.number}</span>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">Name</span>
                        <span className="text-sm text-neutral-800">{phone.firstName} {phone.lastName}</span>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">Email</span>
                        <span className="text-sm text-neutral-800 truncate">{phone.email || '-'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">Address</span>
                        <span className="text-sm text-neutral-800 truncate">
                          {[phone.street, phone.city, phone.postCode].filter(Boolean).join(', ') || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">Last Contacted</span>
                        <span className="text-sm text-neutral-800">{phone.lastContacted || '-'}</span>
                      </div>
                    </div>
                    {!phone.isValid && phone.error && (
                      <span className="text-sm text-red-600 flex-shrink-0">({phone.error})</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (activeTab === 'manual') {
                        removePhoneNumber(phone.id);
                      } else {
                        setUploadedContacts(uploadedContacts.filter(p => p.id !== phone.id));
                      }
                    }}
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
                {activeTab === 'manual'
                  ? validCount > 0 ? `${validCount} call${validCount !== 1 ? 's' : ''} will be queued` : 'No valid numbers to queue'
                  : uploadedContacts.filter(p => p.isValid).length > 0
                    ? `${uploadedContacts.filter(p => p.isValid).length} call${uploadedContacts.filter(p => p.isValid).length !== 1 ? 's' : ''} will be queued`
                    : 'No valid numbers to queue'
                }
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (activeTab === 'manual') {
                      setPhoneNumbers([]);
                    } else {
                      clearBulkUpload();
                    }
                  }}
                >
                  Clear All
                </Button>
                <Button
                  onClick={activeTab === 'manual' ? submitCalls : submitBulkCalls}
                  disabled={
                    (activeTab === 'manual' && (validCount === 0 || submitting)) ||
                    (activeTab === 'bulk' && (uploadedContacts.filter(p => p.isValid).length === 0 || submitting))
                  }
                >
                  {submitting
                    ? 'Queueing...'
                    : activeTab === 'manual'
                      ? `Queue ${validCount} Call${validCount !== 1 ? 's' : ''}`
                      : `Queue ${uploadedContacts.filter(p => p.isValid).length} Call${uploadedContacts.filter(p => p.isValid).length !== 1 ? 's' : ''}`
                  }
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
