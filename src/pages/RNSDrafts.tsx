import React, { useState, useEffect } from 'react';
import { Eye, MoreVertical, Search, Filter, X, PenLine, Trash2 } from 'lucide-react';
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
  const [selectedDocument, setSelectedDocument] = useState<RNSDocument | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleDelete = async () => {
    if (!selectedDocument || !user?.id) return;

    setIsDeleting(true);
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      const { error: deleteError } = await supabase
        .from('rns_documents')
        .delete()
        .eq('id', selectedDocument.id)
        .eq('company_id', companyId);

      if (deleteError) throw deleteError;

      setDocuments(docs => docs.filter(doc => doc.id !== selectedDocument.id));
      setShowDeleteConfirm(false);
      setShowViewModal(false);
      setSelectedDocument(null);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDocument || !user?.id) return;

    setIsSaving(true);
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      const { error: updateError } = await supabase
        .from('rns_documents')
        .update({
          content: editedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDocument.id)
        .eq('company_id', companyId);

      if (updateError) throw updateError;

      setDocuments(docs => docs.map(doc =>
        doc.id === selectedDocument.id
          ? { ...doc, content: editedContent, updated_at: new Date().toISOString() }
          : doc
      ));
      setIsEditing(false);
      setSelectedDocument(prev => prev ? { ...prev, content: editedContent } : null);
    } catch (err) {
      console.error('Error updating document:', err);
      setError('Failed to save changes. Please try again.');
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

  const handleViewDocument = (doc: RNSDocument) => {
    setSelectedDocument(doc);
    setEditedContent(doc.content);
    setShowViewModal(true);
  };

  const renderMarkdown = (content: string) => {
    return content
      .replace(/^RNS Number: (.+)$/gm, '<div class="text-sm text-neutral-600 mb-2"><strong>RNS Number:</strong> $1</div>')
      .replace(/^([A-Z][A-Z\s&]+PLC)$/gm, '<h1 class="text-xl font-bold text-primary mb-2">$1</h1>')
      .replace(/^([A-Z\s:]+)$/gm, '<h2 class="text-lg font-bold text-neutral-800 mb-4 mt-6">$2</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-neutral-800 mb-3 mt-5">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-neutral-800 mb-4 mt-6">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-neutral-800 mb-6 mt-8">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      .split('\n\n')
      .map(paragraph => {
        if (paragraph.trim() === '') return '';
        if (paragraph.includes('<h1>') || paragraph.includes('<h2>') || paragraph.includes('<hr>')) {
          return paragraph;
        }
        return `<p class="mb-4 leading-relaxed">${paragraph}</p>`;
      })
      .join('');
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
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Eye size={16} />}
                            onClick={() => handleViewDocument(doc)}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<PenLine size={16} />}
                            onClick={() => {
                              handleViewDocument(doc);
                              setIsEditing(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Trash2 size={16} />}
                            className="text-error-600 hover:text-error-700"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
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

      {/* View/Edit Modal */}
      {showViewModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-neutral-800">{selectedDocument.title}</h2>
                <p className="text-sm text-neutral-500">
                  Last updated {formatDate(selectedDocument.updated_at)}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setIsEditing(false);
                  setSelectedDocument(null);
                }}
                className="p-1 hover:bg-neutral-100 rounded-full"
              >
                <X size={20} className="text-neutral-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-full min-h-[500px] p-4 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary resize-none font-mono text-sm"
                />
              ) : (
                <div 
                  className="prose prose-neutral max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: renderMarkdown(selectedDocument.content) 
                  }}
                />
              )}
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-between">
              <Button
                variant="outline"
                className="text-error-600 hover:bg-error-50 hover:border-error-600"
                leftIcon={<Trash2 size={18} />}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Draft
              </Button>

              <div className="flex space-x-3">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedContent(selectedDocument.content);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      isLoading={isSaving}
                    >
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowViewModal(false)}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => setIsEditing(true)}
                      leftIcon={<PenLine size={18} />}
                    >
                      Edit Draft
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-4">Delete Draft</h2>
              <p className="text-neutral-600 mb-6">
                Are you sure you want to delete this draft? This action cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-error-600 hover:bg-error-700"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RNSDrafts;