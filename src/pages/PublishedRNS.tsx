import React, { useState, useEffect } from 'react';
import { Eye, MoreVertical, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import Input from '../components/Input';

interface RNSDocument {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string;
  created_at: string;
}

const PublishedRNS: React.FC = () => {
  const [documents, setDocuments] = useState<RNSDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('rns_documents')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching RNS documents:', error);
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
            <Button
              variant="outline"
              leftIcon={<Filter size={18} />}
              className="ml-2"
            >
              Filter
            </Button>
          </div>

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
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Published Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Created Date</th>
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
                        {formatDate(doc.published_at)}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-600">
                        {formatDate(doc.created_at)}
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
    </div>
  );
};

export default PublishedRNS;