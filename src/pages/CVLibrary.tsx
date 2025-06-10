import React, { useState, useEffect, useRef } from 'react';
import { Upload, Search, Filter, FileText, Download, Eye, Trash2, User, Calendar, MapPin, Mail, Phone, Plus, X, Tag as TagIcon, Building2 } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';

interface CVDocument {
  id: string;
  candidate_name: string;
  email: string;
  phone: string | null;
  position_applied: string;
  experience_level: 'Entry Level' | 'Mid Level' | 'Senior Level' | 'Executive';
  location: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  tags: string[];
  notes: string | null;
  status: 'New' | 'Reviewed' | 'Shortlisted' | 'Interviewed' | 'Rejected' | 'Hired';
  uploaded_at: string;
  updated_at: string;
}

const CVLibrary: React.FC = () => {
  const { user } = useAuth();
  const [cvs, setCvs] = useState<CVDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedExperience, setSelectedExperience] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCV, setSelectedCV] = useState<CVDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newCV, setNewCV] = useState({
    candidate_name: '',
    email: '',
    phone: '',
    position_applied: '',
    experience_level: 'Mid Level' as const,
    location: '',
    tags: [] as string[],
    notes: '',
    status: 'New' as const
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newTag, setNewTag] = useState('');

  const statusOptions = ['New', 'Reviewed', 'Shortlisted', 'Interviewed', 'Rejected', 'Hired'] as const;
  const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'] as const;

  useEffect(() => {
    loadCVs();
  }, [user]);

  const loadCVs = async () => {
    if (!user?.id) return;

    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        console.warn('No company found for user');
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('cv_library')
        .select('*')
        .eq('company_id', companyId)
        .order('uploaded_at', { ascending: false });

      if (fetchError) throw fetchError;
      setCvs(data || []);
    } catch (err) {
      console.error('Error loading CVs:', err);
      setError('Failed to load CV library. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !newCV.tags.includes(newTag.trim())) {
      setNewCV(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewCV(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.id) return;

    setIsUploading(true);
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      // In a real implementation, you would upload the file to storage (Cloudinary, S3, etc.)
      // For now, we'll simulate this with a mock URL
      const mockFileUrl = `https://example.com/cvs/${selectedFile.name}`;

      const { data, error: insertError } = await supabase
        .from('cv_library')
        .insert({
          company_id: companyId,
          candidate_name: newCV.candidate_name,
          email: newCV.email,
          phone: newCV.phone || null,
          position_applied: newCV.position_applied,
          experience_level: newCV.experience_level,
          location: newCV.location || null,
          file_url: mockFileUrl,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          tags: newCV.tags,
          notes: newCV.notes || null,
          status: newCV.status
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setCvs([data, ...cvs]);
      setShowUploadModal(false);
      resetForm();
    } catch (err) {
      console.error('Error uploading CV:', err);
      setError('Failed to upload CV. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setNewCV({
      candidate_name: '',
      email: '',
      phone: '',
      position_applied: '',
      experience_level: 'Mid Level',
      location: '',
      tags: [],
      notes: '',
      status: 'New'
    });
    setSelectedFile(null);
    setNewTag('');
    setError(null);
  };

  const handleStatusUpdate = async (cvId: string, newStatus: string) => {
    try {
      const { error: updateError } = await supabase
        .from('cv_library')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', cvId);

      if (updateError) throw updateError;

      setCvs(cvs.map(cv => 
        cv.id === cvId 
          ? { ...cv, status: newStatus as any, updated_at: new Date().toISOString() }
          : cv
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

  const handleDelete = async (cvId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('cv_library')
        .delete()
        .eq('id', cvId);

      if (deleteError) throw deleteError;

      setCvs(cvs.filter(cv => cv.id !== cvId));
    } catch (err) {
      console.error('Error deleting CV:', err);
      setError('Failed to delete CV');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-50 text-blue-700';
      case 'Reviewed': return 'bg-yellow-50 text-yellow-700';
      case 'Shortlisted': return 'bg-purple-50 text-purple-700';
      case 'Interviewed': return 'bg-orange-50 text-orange-700';
      case 'Rejected': return 'bg-red-50 text-red-700';
      case 'Hired': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const filteredCVs = cvs.filter(cv => {
    const matchesSearch = 
      cv.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cv.position_applied.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cv.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'all' || cv.status === selectedStatus;
    const matchesExperience = selectedExperience === 'all' || cv.experience_level === selectedExperience;

    return matchesSearch && matchesStatus && matchesExperience;
  });

  return (
    <div className="px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">CV Library</h1>
        <p className="text-neutral-500">Manage candidate CVs and track recruitment progress</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search candidates, positions, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
                fullWidth
              />
            </div>
            <div className="flex space-x-2 ml-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Experience</option>
                {experienceLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <Button
                leftIcon={<Plus size={18} />}
                onClick={() => setShowUploadModal(true)}
              >
                Upload CV
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
          ) : filteredCVs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Candidate</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Position</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Experience</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Uploaded</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCVs.map((cv) => (
                    <tr
                      key={cv.id}
                      className="border-b border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <User size={18} />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-neutral-900">
                              {cv.candidate_name}
                            </div>
                            <div className="text-sm text-neutral-500 flex items-center">
                              <Mail size={12} className="mr-1" />
                              {cv.email}
                            </div>
                            {cv.location && (
                              <div className="text-sm text-neutral-500 flex items-center">
                                <MapPin size={12} className="mr-1" />
                                {cv.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-neutral-900">{cv.position_applied}</div>
                        {cv.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cv.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="text-xs bg-neutral-100 px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                            {cv.tags.length > 2 && (
                              <span className="text-xs text-neutral-400">+{cv.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-neutral-600">{cv.experience_level}</span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={cv.status}
                          onChange={(e) => handleStatusUpdate(cv.id, e.target.value)}
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-0 ${getStatusColor(cv.status)}`}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-600">
                        {new Date(cv.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Eye size={16} />}
                            onClick={() => {
                              setSelectedCV(cv);
                              setShowViewModal(true);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Download size={16} />}
                            onClick={() => window.open(cv.file_url, '_blank')}
                          >
                            Download
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Trash2 size={16} />}
                            className="text-error-600 hover:text-error-700"
                            onClick={() => handleDelete(cv.id)}
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
              <FileText className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No CVs found</h3>
              <p className="text-neutral-500 mb-4">
                {searchQuery || selectedStatus !== 'all' || selectedExperience !== 'all'
                  ? 'No CVs match your current filters'
                  : 'Upload your first CV to get started'}
              </p>
              <Button
                leftIcon={<Plus size={18} />}
                onClick={() => setShowUploadModal(true)}
              >
                Upload CV
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-neutral-800">Upload CV</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetForm();
                  }}
                  className="p-1 hover:bg-neutral-100 rounded-full"
                >
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    CV Document
                  </label>
                  <div
                    className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="flex items-center justify-center">
                        <FileText className="h-8 w-8 text-primary mr-2" />
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{selectedFile.name}</p>
                          <p className="text-xs text-neutral-500">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                        <p className="text-sm text-neutral-600">Click to upload CV</p>
                        <p className="text-xs text-neutral-500">PDF, DOC, DOCX up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Candidate Information */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Candidate Name"
                    value={newCV.candidate_name}
                    onChange={(e) => setNewCV({ ...newCV, candidate_name: e.target.value })}
                    required
                    fullWidth
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={newCV.email}
                    onChange={(e) => setNewCV({ ...newCV, email: e.target.value })}
                    required
                    fullWidth
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Phone"
                    value={newCV.phone}
                    onChange={(e) => setNewCV({ ...newCV, phone: e.target.value })}
                    fullWidth
                  />
                  <Input
                    label="Location"
                    value={newCV.location}
                    onChange={(e) => setNewCV({ ...newCV, location: e.target.value })}
                    fullWidth
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Position Applied"
                    value={newCV.position_applied}
                    onChange={(e) => setNewCV({ ...newCV, position_applied: e.target.value })}
                    required
                    fullWidth
                  />
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Experience Level
                    </label>
                    <select
                      value={newCV.experience_level}
                      onChange={(e) => setNewCV({ ...newCV, experience_level: e.target.value as any })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      {experienceLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Status
                  </label>
                  <select
                    value={newCV.status}
                    onChange={(e) => setNewCV({ ...newCV, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newCV.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-primary/10 text-primary"
                      >
                        {tag}
                        <button
                          type="button"
                          className="ml-1 hover:text-error-600"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      leftIcon={<TagIcon size={18} />}
                    />
                    <Button
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newCV.notes}
                    onChange={(e) => setNewCV({ ...newCV, notes: e.target.value })}
                    className="w-full h-20 px-4 py-2 border border-neutral-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                    placeholder="Add any additional notes about the candidate..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !newCV.candidate_name || !newCV.email || !newCV.position_applied}
                  isLoading={isUploading}
                  leftIcon={<Upload size={18} />}
                >
                  Upload CV
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedCV && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-neutral-800">CV Details</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedCV(null);
                  }}
                  className="p-1 hover:bg-neutral-100 rounded-full"
                >
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <User size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900">{selectedCV.candidate_name}</h3>
                    <p className="text-neutral-600">{selectedCV.position_applied}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedCV.status)}`}>
                        {selectedCV.status}
                      </span>
                      <span className="text-sm text-neutral-500">{selectedCV.experience_level}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-neutral-700 mb-2">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-neutral-600">
                        <Mail size={14} className="mr-2" />
                        {selectedCV.email}
                      </div>
                      {selectedCV.phone && (
                        <div className="flex items-center text-sm text-neutral-600">
                          <Phone size={14} className="mr-2" />
                          {selectedCV.phone}
                        </div>
                      )}
                      {selectedCV.location && (
                        <div className="flex items-center text-sm text-neutral-600">
                          <MapPin size={14} className="mr-2" />
                          {selectedCV.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-neutral-700 mb-2">File Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-neutral-600">
                        <FileText size={14} className="mr-2" />
                        {selectedCV.file_name}
                      </div>
                      <div className="text-sm text-neutral-600">
                        Size: {formatFileSize(selectedCV.file_size)}
                      </div>
                      <div className="text-sm text-neutral-600">
                        Uploaded: {new Date(selectedCV.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedCV.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-700 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCV.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-neutral-100 text-neutral-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCV.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-700 mb-2">Notes</h4>
                    <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                      {selectedCV.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedCV.file_url, '_blank')}
                  leftIcon={<Download size={18} />}
                >
                  Download CV
                </Button>
                <Button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedCV(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVLibrary;