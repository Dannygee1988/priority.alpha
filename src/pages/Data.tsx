import React, { useState, useRef, useEffect } from 'react';
import { Search, Upload, FileText, Database, Filter, MoreVertical, FileSpreadsheet, File as FilePdf, FileJson, Globe, Plus, X, MessageSquare, Hash, Heart, Users, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getDocuments, getDocumentStats, getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';

interface DocumentStats {
  totalSize: number;
  totalDocuments: number;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  token_count: number;
  url: string;
  created_at: string;
  updated_at: string;
}

type SortField = 'name' | 'created_at' | 'size';
type SortDirection = 'asc' | 'desc';
const Data: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'documents' | 'upload' | 'urls'>('documents');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [url, setUrl] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [extractingSitemap, setExtractingSitemap] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    totalSize: 0,
    totalDocuments: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingUrls, setIsProcessingUrls] = useState(false);
  const [trainingUrls, setTrainingUrls] = useState<string[]>([]);
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    loadData();
    if (activeTab === 'urls') {
      loadTrainingUrls();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'urls') {
      loadTrainingUrls();
    }
  }, [activeTab]);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortDirection]);
  const loadTrainingUrls = async () => {
    if (!user?.id) return;

    setIsLoadingUrls(true);
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        console.warn('No company found for user');
        setIsLoadingUrls(false);
        return;
      }

      const { data, error } = await supabase
        .from('training_urls')
        .select('url')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrainingUrls(data?.map(item => item.url).filter(Boolean) || []);
    } catch (err) {
      console.error('Error loading training URLs:', err);
      setError('Failed to load training URLs. Please try again.');
    } finally {
      setIsLoadingUrls(false);
    }
  };

  const loadData = async () => {
    if (!user?.id) return;

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        console.warn('No company found for user');
        setIsLoading(false);
        return;
      }

      // Fetch documents directly from Supabase
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;

      setDocuments(documentsData || []);

      // Calculate stats from the documents
      const stats = {
        totalSize: documentsData?.reduce((acc, doc) => acc + (doc.size || 0), 0) || 0,
        totalDocuments: documentsData?.length || 0
      };

      setStats(stats);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Failed to load documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp size={14} className="text-neutral-300" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp size={14} className="text-primary" /> : 
      <ChevronDown size={14} className="text-primary" />;
  };
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
      setUploadProgress({});
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    setSelectedFiles(Array.from(files));
    setUploadProgress({});
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || !user?.id) return;

    setIsUploading(true);
    setError(null);

    try {
      // Get company details
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      // Get company name
      const { data: companyData, error: companyError } = await supabase
        .from('company_profiles')
        .select('name')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      const formData = new FormData();
      
      // Add files with their names and extensions
      selectedFiles.forEach((file, index) => {
        formData.append(`file${index}`, file);
        formData.append(`filename${index}`, file.name);
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        formData.append(`extension${index}`, extension);
      });

      // Add company details and number of files
      formData.append('company_id', companyId);
      formData.append('company_name', companyData.name);
      formData.append('file_count', selectedFiles.length.toString());

      const response = await fetch('https://n8n.srv997647.hstgr.cloud/webhook/821b6f3f-f635-422b-916c-b1aed0f2d96f', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload successful:', result);

      // Clear selected files after successful upload
      setSelectedFiles([]);
      // Reload documents
      loadData();
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const handleAddUrl = () => {
    if (url && !urls.includes(url)) {
      setUrls([...urls, url]);
      setUrl('');
    }
  };

  const handleRemoveUrl = (urlToRemove: string) => {
    setUrls(urls.filter(u => u !== urlToRemove));
  };

  const handleRemoveTrainingUrl = async (urlToRemove: string) => {
    if (!user?.id) return;

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) return;

      const { error } = await supabase
        .from('training_urls')
        .delete()
        .eq('company_id', companyId)
        .eq('url', urlToRemove);

      if (error) throw error;
      setTrainingUrls(trainingUrls.filter(u => u !== urlToRemove));
    } catch (err) {
      console.error('Error removing training URL:', err);
      setError('Failed to remove URL. Please try again.');
    }
  };

  const handleProcessUrls = async () => {
    if (!user?.id || urls.length === 0) return;

    setIsProcessingUrls(true);
    setError(null);

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      // Save URLs to database
      const urlInserts = urls.map(url => ({
        company_id: companyId,
        url: url
      }));

      const { error: insertError } = await supabase
        .from('training_urls')
        .insert(urlInserts);

      if (insertError) throw insertError;

      // Send to webhook for processing
      const response = await fetch('https://pri0r1ty.app.n8n.cloud/webhook/url-training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: companyId,
          urls: urls
        })
      });

      if (!response.ok) {
        throw new Error(`Processing failed with status ${response.status}`);
      }

      // Clear the URLs and reload training URLs
      setUrls([]);
      loadTrainingUrls();
      loadData(); // Reload documents in case new ones were created
    } catch (err) {
      console.error('Error processing URLs:', err);
      setError('Failed to process URLs. Please try again.');
    } finally {
      setIsProcessingUrls(false);
    }
  };

  const handleExtractSitemap = async () => {
    setExtractingSitemap(true);
    // Simulate sitemap extraction
    setTimeout(() => {
      setExtractingSitemap(false);
      // Add example URLs from sitemap
      setUrls([
        ...urls,
        'https://example.com/about',
        'https://example.com/products',
        'https://example.com/services',
      ]);
    }, 2000);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FilePdf className="text-error-500" />;
      case 'DOC':
      case 'DOCX':
        return <FileText className="text-primary" />;
      case 'CSV':
        return <FileSpreadsheet className="text-success-500" />;
      case 'JSON':
        return <FileJson className="text-warning-500" />;
      default:
        return <FileText className="text-neutral-500" />;
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'size':
        aValue = a.size;
        bValue = b.size;
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
  // Pagination calculations
  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = sortedDocuments.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Knowledge Base</h1>
        <p className="text-neutral-500">Manage and analyse the data used to train your AI assistant</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Total Documents</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                {stats.totalDocuments || '-'}
              </h3>
            </div>
            <FileText className="text-primary" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Storage Used</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                {stats.totalSize ? formatFileSize(stats.totalSize) : '-'}
              </h3>
            </div>
            <Database className="text-success-500" size={24} />
          </div>
        </div>


        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Data Sources</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                {new Set(documents.map(doc => doc.type)).size || '-'}
              </h3>
            </div>
            <Database className="text-accent" size={24} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg border border-neutral-200">
        {/* Tabs */}
        <div className="border-b border-neutral-200">
          <div className="flex">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'documents'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-neutral-600 hover:text-primary'
              }`}
              onClick={() => setActiveTab('documents')}
            >
              My Documents
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'upload'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-neutral-600 hover:text-primary'
              }`}
              onClick={() => setActiveTab('upload')}
            >
              Upload Data
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'urls'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-neutral-600 hover:text-primary'
              }`}
              onClick={() => setActiveTab('urls')}
            >
              URLs
            </button>
          </div>
        </div>

        {/* Documents List */}
        {activeTab === 'documents' && (
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
              {sortedDocuments.length > 0 && (
                <div className="text-sm text-neutral-500">
                  Showing {startIndex + 1}-{Math.min(endIndex, sortedDocuments.length)} of {sortedDocuments.length} documents
                </div>
              )}
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
            ) : sortedDocuments.length > 0 ? (
              <div>
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center space-x-1 hover:text-neutral-700 transition-colors"
                        >
                          <span>Name</span>
                          {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">
                        <button
                          onClick={() => handleSort('size')}
                          className="flex items-center space-x-1 hover:text-neutral-700 transition-colors"
                        >
                          <span>Size</span>
                          {getSortIcon('size')}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">
                        <button
                          onClick={() => handleSort('created_at')}
                          className="flex items-center space-x-1 hover:text-neutral-700 transition-colors"
                        >
                          <span>Uploaded</span>
                          {getSortIcon('created_at')}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDocuments.map((doc) => (
                      <tr
                        key={doc.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {getFileIcon(doc.type)}
                            <span className="ml-2 text-sm text-neutral-700">{doc.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-600">{doc.type}</td>
                        <td className="py-3 px-4 text-sm text-neutral-600">{formatFileSize(doc.size)}</td>
                        <td className="py-3 px-4 text-sm text-neutral-600">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <button className="p-1 hover:bg-neutral-100 rounded-full">
                            <MoreVertical size={16} className="text-neutral-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-neutral-200">
                  <div className="text-sm text-neutral-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      leftIcon={<ChevronLeft size={16} />}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex space-x-1">
                      {generatePageNumbers().map((page, index) => (
                        <button
                          key={index}
                          onClick={() => typeof page === 'number' ? handlePageChange(page) : undefined}
                          disabled={page === '...'}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            page === currentPage
                              ? 'bg-primary text-white'
                              : page === '...'
                              ? 'text-neutral-400 cursor-default'
                              : 'text-neutral-600 hover:bg-neutral-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      rightIcon={<ChevronRight size={16} />}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-500">No documents found</p>
              </div>
            )}
          </div>
        )}

        {/* URLs Tab */}
        {activeTab === 'urls' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-neutral-800 mb-2">URL Training Data</h2>
              <p className="text-sm text-neutral-500">
                Add URLs to extract content and build training data for your AI assistant
              </p>
            </div>

            {/* Add URL Section */}
            <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-6 mb-6">
              <h3 className="text-md font-medium text-neutral-800 mb-4">Add New URLs</h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter URL to train from..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      leftIcon={<Globe size={18} />}
                      fullWidth
                    />
                  </div>
                  <Button
                    onClick={handleAddUrl}
                    disabled={!url}
                    className="whitespace-nowrap h-[42px]"
                  >
                    Add URL
                  </Button>
                </div>

                {urls.length > 0 && (
                  <div className="bg-white rounded-lg border border-neutral-200 p-4">
                    <h4 className="text-sm font-medium text-neutral-700 mb-3">
                      URLs to Process ({urls.length})
                    </h4>
                    <div className="space-y-2 mb-4">
                      {urls.map((url, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-neutral-50 p-3 rounded-lg border border-neutral-200"
                        >
                          <div className="flex items-center">
                            <Globe size={18} className="text-primary mr-2" />
                            <span className="text-sm text-neutral-700 break-all">{url}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUrl(url)}
                            className="text-error-600 hover:text-error-700"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        onClick={handleExtractSitemap}
                        isLoading={extractingSitemap}
                      >
                        Extract Sitemap
                      </Button>
                      <Button
                        onClick={handleProcessUrls}
                        isLoading={isProcessingUrls}
                        leftIcon={<Plus size={18} />}
                      >
                        {isProcessingUrls ? 'Processing URLs...' : 'Start Training'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Existing Training URLs */}
            <div>
              <h3 className="text-md font-medium text-neutral-800 mb-4">Training URLs</h3>
              {isLoadingUrls ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : trainingUrls.length > 0 ? (
                <div className="bg-white rounded-lg border border-neutral-200">
                  <div className="divide-y divide-neutral-200">
                    {trainingUrls.map((trainingUrl, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 hover:bg-neutral-50"
                      >
                        <div className="flex items-center">
                          <Globe size={18} className="text-success-500 mr-3" />
                          <div>
                            <span className="text-sm text-neutral-700 break-all">{trainingUrl}</span>
                            <div className="text-xs text-success-600 mt-1">✓ Processed</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTrainingUrl(trainingUrl)}
                          className="text-error-600 hover:text-error-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                  <Globe size={48} className="mx-auto text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-800 mb-2">No Training URLs</h3>
                  <p className="text-neutral-500">
                    Add URLs above to start building training data from web content
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Section */}
        {activeTab === 'upload' && (
          <div className="p-6">
            {/* File Upload Section */}
            <div
              className={`border-2 border-dashed border-neutral-200 rounded-lg p-8 ${
                selectedFiles.length > 0 ? 'bg-neutral-50' : ''
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept=".pdf,.txt,.doc,.docx,.csv,.json"
              />
              
              {selectedFiles.length === 0 ? (
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-neutral-400" />
                  <h3 className="mt-2 text-sm font-medium text-neutral-900">
                    Drag & drop files here
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    or click to browse files
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    Supported formats: PDF, TXT, DOC, DOCX, CSV, JSON
                  </p>
                  <div className="mt-6">
                    <Button onClick={triggerFileInput}>
                      Browse Files
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 mb-4">
                    Selected Files ({selectedFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border border-neutral-200"
                      >
                        <div className="flex items-center">
                          {getFileIcon(file.type.split('/')[1].toUpperCase())}
                          <span className="ml-2 text-sm text-neutral-700">{file.name}</span>
                        </div>
                        <span className="text-sm text-neutral-500">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFiles([]);
                        setUploadProgress({});
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={handleUpload}
                      isLoading={isUploading}
                    >
                      Upload Files
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-error-50 text-error-700 rounded-md">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Data;