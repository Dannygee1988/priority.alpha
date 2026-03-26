import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';

interface ConfigurationSettings {
  primary_color?: string;
  secondary_color?: string;
}

const AdvisorConfiguration: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ConfigurationSettings>({
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
        .select('primary_color, secondary_color')
        .eq('id', companyId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setSettings({
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
