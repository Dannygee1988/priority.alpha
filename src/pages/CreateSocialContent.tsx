import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Facebook, Instagram, Linkedin, X } from 'lucide-react';

const platforms = [
  { id: 'x', name: 'X', icon: X, color: 'black' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F' }
];

function CreateSocialContent() {
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: userCompanies } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!userCompanies) throw new Error('No company found');

      const posts = selectedPlatforms.map(platform => ({
        company_id: userCompanies.company_id,
        platform,
        content,
        status: 'draft'
      }));

      const { error } = await supabase
        .from('social_posts')
        .insert(posts);

      if (error) throw error;

      navigate('/social');
    } catch (error) {
      console.error('Error creating posts:', error);
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  };

  const getCharacterLimit = (platform: string) => {
    switch (platform) {
      case 'x':
        return 280;
      case 'facebook':
        return 63206;
      case 'linkedin':
        return 3000;
      case 'instagram':
        return 2200;
      default:
        return Infinity;
    }
  };

  const maxLength = Math.min(
    ...selectedPlatforms.map(p => getCharacterLimit(p))
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create Social Media Post</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Platforms
          </label>
          <div className="flex flex-wrap gap-4">
            {platforms.map(platform => (
              <button
                key={platform.id}
                type="button"
                onClick={() => handlePlatformToggle(platform.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                  selectedPlatforms.includes(platform.id)
                    ? 'bg-gray-100 border-gray-300'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <platform.icon
                  size={20}
                  color={platform.color}
                  className="shrink-0"
                />
                <span className="text-sm font-medium">{platform.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
            {selectedPlatforms.length > 0 && (
              <span className="text-gray-500 ml-2">
                ({content.length}/{maxLength} characters)
              </span>
            )}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={maxLength}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Write your post content here..."
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/social')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || selectedPlatforms.length === 0 || !content.trim()}
          >
            {loading ? 'Creating...' : 'Create Posts'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateSocialContent;