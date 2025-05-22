import React, { useState } from 'react';
import { Search, Upload, FileText, Database, Layers, Filter, MoreVertical, FileSpreadsheet, FilePdf, FileJson } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';

const Data: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'upload'>('documents');

  const documents = [
    { 
      name: 'company-handbook.pdf',
      type: 'PDF',
      size: '2.42 MB',
      uploaded: 'May 15, 2023',
      tokens: '12,500'
    },
    {
      name: 'quarterly-report-q1.docx',
      type: 'DOC',
      size: '1.19 MB',
      uploaded: 'Jun 2, 2023',
      tokens: '8,200'
    },
    {
      name: 'customer-feedback.csv',
      type: 'CSV',
      size: '800.78 KB',
      uploaded: 'Jun 10, 2023',
      tokens: '4,100'
    },
    {
      name: 'product-specifications.txt',
      type: 'TXT',
      size: '341.8 KB',
      uploaded: 'Jun 15, 2023',
      tokens: '1,750'
    }
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FilePdf className="text-error-500" />;
      case 'DOC':
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
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">7</h3>
            </div>
            <FileText className="text-primary" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Storage Used</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">10.45 MB</h3>
            </div>
            <Database className="text-success-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Total Tokens</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">56,500</h3>
            </div>
            <Layers className="text-warning-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Data Sources</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">3</h3>
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
                  {documents.map((doc, index) => (
                    <tr
                      key={index}
                      className="border-b border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {getFileIcon(doc.type)}
                          <span className="ml-2 text-sm text-neutral-700">{doc.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-600">{doc.type}</td>
                      <td className="py-3 px-4 text-sm text-neutral-600">{doc.size}</td>
                      <td className="py-3 px-4 text-sm text-neutral-600">{doc.uploaded}</td>
                      <td className="py-3 px-4 text-sm text-neutral-600">{doc.tokens}</td>
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
          </div>
        )}

        {/* Upload Section */}
        {activeTab === 'upload' && (
          <div className="p-6">
            <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8">
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
                  <Button>
                    Browse Files
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="text-sm font-medium text-neutral-900 mb-4">Tips for Better Results</h4>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-neutral-600">
                  <span className="flex items-center justify-center w-5 h-5 bg-primary/10 text-primary rounded-full text-xs font-medium mr-2">
                    1
                  </span>
                  Upload clean, well-formatted documents for better processing
                </li>
                <li className="flex items-center text-sm text-neutral-600">
                  <span className="flex items-center justify-center w-5 h-5 bg-primary/10 text-primary rounded-full text-xs font-medium mr-2">
                    2
                  </span>
                  Text-based PDFs work better than scanned documents
                </li>
                <li className="flex items-center text-sm text-neutral-600">
                  <span className="flex items-center justify-center w-5 h-5 bg-primary/10 text-primary rounded-full text-xs font-medium mr-2">
                    3
                  </span>
                  Organize related documents in batches for improved context
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Data;