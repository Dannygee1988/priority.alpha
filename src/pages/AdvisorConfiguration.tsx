import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';
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
}

const AdvisorConfiguration: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ConfigurationSettings>({
    prompt: '',
    temperature: 0.7,
    top_p: 1,
    css: '',
    primary_color: '#060644',
    secondary_color: '#F6CCE0'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        .select('settings, primary_color, secondary_color')
        .eq('id', companyId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setSettings({
          prompt: data.settings?.advisor_prompt || '',
          temperature: data.settings?.advisor_temperature ?? 0.7,
          top_p: data.settings?.advisor_top_p ?? 1,
          css: data.settings?.advisor_css || '',
          primary_color: data.primary_color || '#060644',
          secondary_color: data.secondary_color || '#F6CCE0'
        });
      }
    } catch (err) {
      console.error('Error loading configuration:', err);
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
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
          secondary_color: settings.secondary_color
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

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Agent Prompt
              </label>
              <textarea
                value={settings.prompt}
                onChange={(e) => setSettings({ ...settings, prompt: e.target.value })}
                placeholder="Enter custom system prompt for the advisor..."
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                rows={6}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Define the behavior and personality of your AI advisor
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
