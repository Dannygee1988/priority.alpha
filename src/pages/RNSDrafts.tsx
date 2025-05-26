import React, { useState, useEffect } from 'react';
import { Eye, MoreVertical, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import Input from '../components/Input';
import { getUserCompany } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface RNSDocument {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

const RNSDrafts: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<RNSDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
        .eq('status', 'draft')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching RNS documents:', error);
      setError('Failed to load drafts. Please try again later.');
    } finally {
      setIsLoading(false);
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
        <h1 className="text-2xl font-bold text-neutral-800">RNS Drafts</h1>
        <p className="text-neutral-500">View and manage your draft RNS announcements</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search drafts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
                fullWidth
              />
            </div>
            <Button
              variant="outline"
              leftIcon={<Filter size={18} />}
              className="ml-2"
            >
              Filter
            </Button>
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Created</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Last Updated</th>
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
                      <td className="py-3 px-4 text-sm text-neutral-600">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-600">
                        {formatDate(doc.updated_at)}
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
              <p className="text-neutral-500">No draft RNS documents found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RNSDrafts;