import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';

interface ConfigurationSettings {
  prompt?: string;
  temperature?: number;
  top_p?: number;
  css?: string;
  primary_color?: string;
  secondary_color?: string;
  firestore_customer_id?: string;
  assistant_id?: string;
}

interface AssistantConfig {
  id: string;
  name: string;
  description: string;
  instructions: string;
  model: string;
  tools: any[];
  temperature: number;
  top_p: number;
}

const DEFAULT_MIA_PROMPT = `Your goal is to act as Mia, the dedicated digital assistant for Leukemia Care UK. You provide accurate, empathetic, and strictly grounded information to patients, carers, and healthcare professionals. You must use the "data store" for every response to ensure that every piece of medical or support advice is verified and safe, helping users navigate the complexities of a blood cancer diagnosis with clarity and compassion.

Instructions
1. The "Data Store" First Mandate
Mandatory Retrieval: You are prohibited from answering any factual or medical question from your internal training memory. You must call the data store tool for every query.

Grounded Accuracy: If the data store does not return a specific answer, you must gracefully admit you do not have that information.

Example: "I'm sorry, I couldn't find a specific answer to that in our current resources. To ensure you get the right advice, I recommend speaking with your consultant or calling our nurse-led helpline."

2. Clinical Empathy & Tone
Tone: Be warm, calm, and supportive. Avoid being overly clinical or cold, but never provide "false hope."

Language: Use British English and inclusive terminology. Use "we" when referring to Leukemia Care services (e.g., "We offer financial support grants").

Clarity: Leukemia involves complex terminology. If the data store provides a technical explanation, break it down into digestible points for the user.

3. Safety & Emergency Protocols
Emergency Redirection: If a user mentions symptoms that sound like an emergency (e.g., "I have a very high fever and I'm on chemotherapy"), prioritize advising them to contact their medical team immediately or call 999.

No Prescriptions: You cannot tell a user to change their medication dosage. You may only report what the data store says about general side effects.

4. Structuring Responses
Scannability: Use bullet points for symptoms, treatment types, or lists of services.

Next Steps: Always end a factual answer with a helpful next step, such as offering a link to a relevant PDF guide or the phone number for the Leukemia Care support line.

5. Handling Sensitive Topics
End of Life/Relapse: Handle these topics with the utmost sensitivity. Ensure your answers are pulled directly from the "data store" and emphasize the emotional support services available through Leukemia Care.`;

const AdvisorConfiguration: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ConfigurationSettings>({
    prompt: DEFAULT_MIA_PROMPT,
    temperature: 0.7,
    top_p: 1,
    css: '',
    primary_color: '#060644',
    secondary_color: '#F6CCE0',
    firestore_customer_id: '',
    assistant_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [assistantConfig, setAssistantConfig] = useState<AssistantConfig | null>(null);
  const [fetchingAssistant, setFetchingAssistant] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, [user]);

  const loadConfiguration = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      const { data, error: fetchError } = await supabase
        .from('company_profiles')
        .select('settings, primary_color, secondary_color, firestore_customer_id, assistant_id')
        .eq('id', companyId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setSettings({
          prompt: data.settings?.advisor_prompt || DEFAULT_MIA_PROMPT,
          temperature: data.settings?.advisor_temperature ?? 0.7,
          top_p: data.settings?.advisor_top_p ?? 1,
          css: data.settings?.advisor_css || '',
          primary_color: data.primary_color || '#060644',
          secondary_color: data.secondary_color || '#F6CCE0',
          firestore_customer_id: data.firestore_customer_id || '',
          assistant_id: data.assistant_id || ''
        });

        // If assistant_id exists, fetch the config automatically
        if (data.assistant_id) {
          fetchAssistantConfig(data.assistant_id);
        }
      }
    } catch (err) {
      console.error('Error loading configuration:', err);
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssistantConfig = async (assistantId: string) => {
    if (!assistantId) return;

    try {
      setFetchingAssistant(true);
      setError(null);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-assistant-threads`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId,
          action: 'getAssistantConfig'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assistant configuration');
      }

      const config = await response.json();
      setAssistantConfig(config);
    } catch (err) {
      console.error('Error fetching assistant config:', err);
      setError('Failed to fetch OpenAI assistant configuration');
    } finally {
      setFetchingAssistant(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      const { error: updateError } = await supabase
        .from('company_profiles')
        .update({
          settings: {
            advisor_prompt: settings.prompt,
            advisor_temperature: settings.temperature,
            advisor_top_p: settings.top_p,
            advisor_css: settings.css
          },
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          firestore_customer_id: settings.firestore_customer_id,
          assistant_id: settings.assistant_id
        })
        .eq('id', companyId);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8 h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-neutral-500">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 h-[calc(100vh-4rem)] animate-fade-in overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center">
              <Settings className="text-primary mr-3" size={24} />
              <div>
                <h1 className="text-2xl font-bold text-neutral-800">Advisor Configuration</h1>
                <p className="text-neutral-500">Customize your AI advisor settings</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start">
                <AlertCircle size={18} className="mt-0.5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg">
                Configuration saved successfully
              </div>
            )}

            <div className="border-t border-neutral-200 pt-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">OpenAI Assistant Integration</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Connect to an existing OpenAI Assistant to view its configuration
              </p>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Assistant ID
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={settings.assistant_id || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      assistant_id: e.target.value
                    })}
                    placeholder="asst_..."
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-mono text-sm"
                  />
                  <Button
                    onClick={() => fetchAssistantConfig(settings.assistant_id || '')}
                    isLoading={fetchingAssistant}
                    leftIcon={<RefreshCw size={18} />}
                    disabled={!settings.assistant_id}
                  >
                    Fetch Config
                  </Button>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Enter your OpenAI Assistant ID to retrieve its system prompt and settings
                </p>
              </div>

              {assistantConfig && (
                <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <h4 className="font-semibold text-neutral-800 mb-2">{assistantConfig.name}</h4>
                  {assistantConfig.description && (
                    <p className="text-sm text-neutral-600 mb-3">{assistantConfig.description}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-700">Model:</span>
                      <span className="text-neutral-600">{assistantConfig.model}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-700">Temperature:</span>
                      <span className="text-neutral-600">{assistantConfig.temperature}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-700">Top P:</span>
                      <span className="text-neutral-600">{assistantConfig.top_p}</span>
                    </div>
                    {assistantConfig.tools && assistantConfig.tools.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-neutral-700">Tools:</span>
                        <span className="text-neutral-600">
                          {assistantConfig.tools.map((t: any) => t.type).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      System Instructions
                    </label>
                    <textarea
                      value={assistantConfig.instructions || 'No instructions configured'}
                      readOnly
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg bg-white font-mono text-sm resize-none"
                      rows={10}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Agent Prompt
              </label>
              <textarea
                value={settings.prompt}
                onChange={(e) => setSettings({ ...settings, prompt: e.target.value })}
                placeholder="Enter custom system prompt for the advisor..."
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary resize-none font-mono text-sm"
                rows={12}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Define the behavior and personality of Mia, your AI advisor for Leukemia Care UK
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Temperature
                </label>
                <input
                  type="number"
                  value={settings.temperature}
                  onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                  min="0"
                  max="2"
                  step="0.1"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Controls randomness (0-2). Higher values make output more creative.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Top P
                </label>
                <input
                  type="number"
                  value={settings.top_p}
                  onChange={(e) => setSettings({ ...settings, top_p: parseFloat(e.target.value) })}
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Controls diversity (0-1). Lower values focus on likely tokens.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="w-16 h-10 rounded border border-neutral-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                    className="w-16 h-10 rounded border border-neutral-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.secondary_color}
                    onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Custom CSS
              </label>
              <textarea
                value={settings.css}
                onChange={(e) => setSettings({ ...settings, css: e.target.value })}
                placeholder="Enter custom CSS styles..."
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary resize-none font-mono text-sm"
                rows={8}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Add custom styling for the advisor interface
              </p>
            </div>

            <div className="border-t border-neutral-200 pt-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">Firestore Integration</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Enter your unique customer ID to display your Firestore conversation analytics
              </p>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Firestore Customer ID
                </label>
                <input
                  type="text"
                  value={settings.firestore_customer_id || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    firestore_customer_id: e.target.value
                  })}
                  placeholder="Enter your customer ID"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-mono text-sm"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  This ID will be used to filter conversations from the shared Firestore database
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                isLoading={saving}
                leftIcon={<Save size={18} />}
              >
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorConfiguration;
