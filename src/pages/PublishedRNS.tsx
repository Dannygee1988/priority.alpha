import React, { useState, useEffect } from 'react';
import { Eye, Search, Filter, Plus, X, ChevronDown, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';

interface RNSDocument {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string;
  created_at: string;
  type: string;
  lse_url?: string;
}

type RNSType = 
  | 'Financial Results'
  | 'Acquisitions and Disposals'
  | 'Dividend Announcements'
  | 'Corporate Governance Changes'
  | 'Share Issuance and Buybacks'
  | 'Regulatory Compliance'
  | 'Inside Information'
  | 'Strategic Updates'
  | 'Risk Factors'
  | 'Sustainability and Corporate Social Responsibility';

const PublishedRNS: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<RNSDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const [newRNS, setNewRNS] = useState({
    title: '',
    content: '',
    type: 'Inside Information' as RNSType,
    published_at: new Date().toISOString().split('T')[0],
    lse_url: ''
  });

  const announcementTypes: RNSType[] = [
    'Financial Results',
    'Acquisitions and Disposals',
    'Dividend Announcements',
    'Corporate Governance Changes',
    'Share Issuance and Buybacks',
    'Regulatory Compliance',
    'Inside Information',
    'Strategic Updates',
    'Risk Factors',
    'Sustainability and Corporate Social Responsibility'
  ];

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user?.id) return;

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        console.warn('No company found for user');
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('rns_documents')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching RNS documents:', error);
      setError('Failed to load documents. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRNS = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      const { data, error: insertError } = await supabase
        .from('rns_documents')
        .insert({
          company_id: companyId,
          title: newRNS.title,
          content: newRNS.content,
          type: newRNS.type,
          status: 'published',
          published_at: new Date(newRNS.published_at).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          lse_url: newRNS.lse_url
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setDocuments([data, ...documents]);
      setShowAddModal(false);
      setNewRNS({
        title: '',
        content: '',
        type: 'Inside Information',
        published_at: new Date().toISOString().split('T')[0],
        lse_url: ''
      });
    } catch (err) {
      console.error('Error adding RNS:', err);
      setError('Failed to add RNS. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Published RNS Documents</h1>
        <p className="text-neutral-500">View and manage your published regulatory news announcements</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search documents..."
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
                className="ml-2"
              >
                Filter
              </Button>
              <Button
                leftIcon={<Plus size={18} />}
                onClick={() => setShowAddModal(true)}
              >
                Add Published RNS
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
          ) : filteredDocuments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Published Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">LSE Link</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm text-neutral-700">{doc.title}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-neutral-600">{doc.type}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-600">
                        {formatDate(doc.published_at)}
                      </td>
                      <td className="py-3 px-4">
                        {doc.lse_url ? (
                          <a
                            href={doc.lse_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary-700 flex items-center text-sm"
                          >
                            <LinkIcon size={14} className="mr-1" />
                            View on LSE
                          </a>
                        ) : (
                          <span className="text-sm text-neutral-400">No link</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye size={16} />}
                          onClick={() => navigate(`/pr/rns/view/${doc.id}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-500">No published RNS documents found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add RNS Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-neutral-800">Add Published RNS</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewRNS({
                      title: '',
                      content: '',
                      type: 'Inside Information',
                      published_at: new Date().toISOString().split('T')[0],
                      lse_url: ''
                    });
                  }}
                  className="p-1 hover:bg-neutral-100 rounded-full"
                >
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              <div className="space-y-6">
                <Input
                  label="Title"
                  value={newRNS.title}
                  onChange={(e) => setNewRNS({ ...newRNS, title: e.target.value })}
                  placeholder="Enter RNS title"
                  required
                  fullWidth
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Type
                  </label>
                  <div className="relative">
                    <select
                      value={newRNS.type}
                      onChange={(e) => setNewRNS({ ...newRNS, type: e.target.value as RNSType })}
                      className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
                    >
                      {announcementTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ChevronDown size={16} className="text-neutral-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Published Date
                  </label>
                  <Input
                    type="date"
                    value={newRNS.published_at}
                    onChange={(e) => setNewRNS({ ...newRNS, published_at: e.target.value })}
                    required
                    fullWidth
                  />
                </div>

                <Input
                  label="London Stock Exchange URL"
                  value={newRNS.lse_url}
                  onChange={(e) => setNewRNS({ ...newRNS, lse_url: e.target.value })}
                  placeholder="Enter LSE announcement URL"
                  leftIcon={<LinkIcon size={18} />}
                  fullWidth
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={newRNS.content}
                    onChange={(e) => setNewRNS({ ...newRNS, content: e.target.value })}
                    className="w-full h-60 px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                    placeholder="Enter the RNS content..."
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewRNS({
                      title: '',
                      content: '',
                      type: 'Inside Information',
                      published_at: new Date().toISOString().split('T')[0],
                      lse_url: ''
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddRNS}
                  disabled={!newRNS.title || !newRNS.content}
                  isLoading={isSaving}
                >
                  Add RNS
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishedRNS;