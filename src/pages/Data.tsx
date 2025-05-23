import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Search, Upload, FileText, Database, Layers, Filter, MoreVertical, FileSpreadsheet, File as FilePdf, FileJson, Globe, Plus } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getDocuments, getDocumentStats, getUserCompany } from '../lib/api';

interface DocumentStats {
  totalSize: number;
  totalTokens: number;
  totalDocuments: number;
}

const Data: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'documents' | 'upload'>('documents');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [url, setUrl] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [extractingSitemap, setExtractingSitemap] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    totalSize: 0,
    totalTokens: 0,
    totalDocuments: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        try {
          const companyId = await getUserCompany(user.id);
          
          if (!companyId) {
            console.warn('No company found for user');
            setIsLoading(false);
            return;
          }

          const [docsData, statsData] = await Promise.all([
            getDocuments(companyId),
            getDocumentStats(companyId)
          ]);

          setDocuments(docsData);
          setStats(statsData);
        } catch (error) {
          console.error('Error loading documents:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [user]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    setSelectedFiles(Array.from(files));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
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

  return (
    <div className="px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Knowledge Base</h1>
        <p className="text-neutral-500">Manage and analyze the data used to train your AI assistant</p>
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
              <p className="text-neutral-600 text-sm font-medium">Total Tokens</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                {stats.totalTokens ? stats.totalTokens.toLocaleString() : '-'}
              </h3>
            </div>
            <Layers className="text-warning-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Data Sources</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                {documents.length || '-'}
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
          </div>
        </div>

        {/* Documents List */}
        {activeTab === 'documents' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search documents..."
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
            ) : documents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Size</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Uploaded</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Tokens</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
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
                        <td className="py-3 px-4 text-sm text-neutral-600">{doc.token_count?.toLocaleString() || '-'}</td>
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
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-500">No documents found</p>
              </div>
            )}
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
                      onClick={() => setSelectedFiles([])}
                    >
                      Clear
                    </Button>
                    <Button>
                      Upload Files
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* URL Training Section */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-neutral-800 mb-4">URL Training Data</h2>
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
                  <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4">
                    <div className="space-y-2">
                      {urls.map((url, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-white p-3 rounded-lg border border-neutral-200"
                        >
                          <div className="flex items-center">
                            <Globe size={18} className="text-primary" />
                            <span className="ml-2 text-sm text-neutral-700">{url}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUrl(url)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <Button
                        variant="outline"
                        onClick={handleExtractSitemap}
                        isLoading={extractingSitemap}
                      >
                        Extract Sitemap
                      </Button>
                      <Button>
                        Start Training
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Data;