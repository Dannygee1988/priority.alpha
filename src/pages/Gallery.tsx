import React, { useState, useEffect } from 'react';
import { Upload, Search, Filter, Grid, List, Plus, Image as ImageIcon, MoreVertical, X, Tag as TagIcon, Trash2, Sparkles, Download, Heart } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getUserCompany } from '../lib/api';

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  description: string | null;
  type: string | null;
  tags: string[];
  created_at: string;
}

interface StockImage {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  tags: string[];
  photographer: string;
  source: string;
}

const Gallery: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStockPhotoModal, setShowStockPhotoModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [newTag, setNewTag] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stock photo search states
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockImages, setStockImages] = useState<StockImage[]>([]);
  const [isSearchingStock, setIsSearchingStock] = useState(false);
  const [selectedStockImage, setSelectedStockImage] = useState<StockImage | null>(null);
  const [isDownloadingStock, setIsDownloadingStock] = useState(false);

  useEffect(() => {
    loadImages();
  }, [user]);

  const loadImages = async () => {
    if (!user?.id) return;
    
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        console.warn('No company found for user');
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setImages(data || []);
    } catch (err) {
      console.error('Error loading images:', err);
      setError('Failed to load images. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image);
    setEditedTitle(image.title);
    setEditedTags(image.tags || []);
    setShowEditModal(true);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editedTags.includes(newTag.trim())) {
      setEditedTags([...editedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!selectedImage) return;

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('gallery_images')
        .update({
          title: editedTitle,
          tags: editedTags
        })
        .eq('id', selectedImage.id);

      if (updateError) throw updateError;

      // Update local state
      setImages(images.map(img => 
        img.id === selectedImage.id 
          ? { ...img, title: editedTitle, tags: editedTags }
          : img
      ));

      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating image:', err);
      setError('Failed to update image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedImage) return;

    setIsDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', selectedImage.id);

      if (deleteError) throw deleteError;

      // Update local state
      setImages(images.filter(img => img.id !== selectedImage.id));
      setShowDeleteConfirm(false);
      setShowEditModal(false);
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStockPhotoSearch = async () => {
    if (!stockSearchQuery.trim()) return;

    setIsSearchingStock(true);
    try {
      // Simulate API call to stock photo service
      // In a real implementation, this would call Unsplash, Pexels, or similar API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock stock images based on search query - Only 2 results
      const mockStockImages: StockImage[] = [
        {
          id: '1',
          url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=200&fit=crop',
          title: `Business meeting - ${stockSearchQuery}`,
          tags: [stockSearchQuery, 'business', 'meeting', 'professional'],
          photographer: 'John Doe',
          source: 'Unsplash'
        },
        {
          id: '2',
          url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop',
          title: `Technology workspace - ${stockSearchQuery}`,
          tags: [stockSearchQuery, 'technology', 'workspace', 'modern'],
          photographer: 'Jane Smith',
          source: 'Unsplash'
        }
      ];

      setStockImages(mockStockImages);
    } catch (err) {
      console.error('Error searching stock photos:', err);
      setError('Failed to search stock photos. Please try again.');
    } finally {
      setIsSearchingStock(false);
    }
  };

  const handleDownloadStockImage = async (stockImage: StockImage) => {
    if (!user?.id) return;

    setIsDownloadingStock(true);
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        throw new Error('No company found');
      }

      // In a real implementation, you would:
      // 1. Download the image from the stock photo service
      // 2. Upload it to your storage (Cloudinary, S3, etc.)
      // 3. Save the reference in your database

      // For now, we'll simulate this process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data, error: insertError } = await supabase
        .from('gallery_images')
        .insert({
          company_id: companyId,
          url: stockImage.url,
          title: stockImage.title,
          description: `Stock photo by ${stockImage.photographer} from ${stockImage.source}`,
          type: 'stock_photo',
          tags: stockImage.tags
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update local state
      setImages([data, ...images]);
      setShowStockPhotoModal(false);
      setStockSearchQuery('');
      setStockImages([]);
      setSelectedStockImage(null);
    } catch (err) {
      console.error('Error downloading stock image:', err);
      setError('Failed to download stock image. Please try again.');
    } finally {
      setIsDownloadingStock(false);
    }
  };

  const handleStockSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleStockPhotoSearch();
    }
  };

  return (
    <div className="px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Media Gallery</h1>
        <p className="text-neutral-500">Manage and organize your media assets</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search media..."
                leftIcon={<Search size={18} />}
                fullWidth
              />
            </div>
            <div className="flex space-x-2">
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-l-md border ${
                    viewMode === 'grid'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-r-md border-y border-r ${
                    viewMode === 'list'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
              <Button
                variant="outline"
                leftIcon={<Filter size={18} />}
              >
                Filter
              </Button>
              <Button
                variant="outline"
                leftIcon={<Sparkles size={18} />}
                onClick={() => setShowStockPhotoModal(true)}
              >
                Stock Photos
              </Button>
              <Button
                leftIcon={<Plus size={18} />}
                onClick={() => setShowUploadModal(true)}
              >
                Upload Media
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
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon size={48} className="mx-auto text-neutral-300 mb-4" />
              <p className="text-neutral-500">No images uploaded yet</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative bg-neutral-50 rounded-lg border border-neutral-200 overflow-hidden cursor-pointer"
                  onClick={() => handleImageClick(image)}
                >
                  <div className="aspect-square">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                    <h3 className="font-medium text-sm">{image.title}</h3>
                    {image.tags && image.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {image.tags.map((tag, index) => (
                          <span key={index} className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Media</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Created</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {images.map((image) => (
                    <tr
                      key={image.id}
                      className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                      onClick={() => handleImageClick(image)}
                    >
                      <td className="py-3 px-4">
                        <div className="h-12 w-12 rounded-lg overflow-hidden">
                          <img
                            src={image.url}
                            alt={image.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-neutral-900">{image.title}</span>
                        {image.tags && image.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {image.tags.map((tag, index) => (
                              <span key={index} className="text-xs bg-neutral-100 px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <ImageIcon size={16} className="text-neutral-400 mr-2" />
                          <span className="text-sm text-neutral-600">{image.type || 'Image'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-neutral-600">
                          {new Date(image.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          className="p-1 hover:bg-neutral-100 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(image);
                          }}
                        >
                          <MoreVertical size={16} className="text-neutral-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Stock Photo Search Modal */}
      {showStockPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-neutral-800 flex items-center">
                    <Sparkles size={24} className="mr-2 text-primary" />
                    Stock Photo Search
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Find professional stock photos using AI-powered search
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowStockPhotoModal(false);
                    setStockSearchQuery('');
                    setStockImages([]);
                    setSelectedStockImage(null);
                  }}
                  className="p-1 hover:bg-neutral-100 rounded-full"
                >
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              {/* Search Input */}
              <div className="flex space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={stockSearchQuery}
                    onChange={(e) => setStockSearchQuery(e.target.value)}
                    onKeyDown={handleStockSearchKeyDown}
                    placeholder="Describe the image you're looking for (e.g., 'business meeting', 'technology', 'teamwork')..."
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <Button
                  onClick={handleStockPhotoSearch}
                  isLoading={isSearchingStock}
                  disabled={!stockSearchQuery.trim()}
                  leftIcon={<Search size={18} />}
                  className="px-6"
                >
                  {isSearchingStock ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isSearchingStock ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-neutral-600">Searching for stock photos...</p>
                    <p className="text-sm text-neutral-500 mt-2">Finding the perfect images for you</p>
                  </div>
                </div>
              ) : stockImages.length > 0 ? (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-neutral-800">
                      Search Results for "{stockSearchQuery}"
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {stockImages.length} images found
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {stockImages.map((stockImage) => (
                      <div
                        key={stockImage.id}
                        className={`group relative bg-neutral-50 rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                          selectedStockImage?.id === stockImage.id
                            ? 'border-primary'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                        onClick={() => setSelectedStockImage(stockImage)}
                      >
                        <div className="aspect-[4/3]">
                          <img
                            src={stockImage.thumbnail}
                            alt={stockImage.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200" />
                        
                        {/* Selection indicator */}
                        {selectedStockImage?.id === stockImage.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Heart size={14} className="text-white fill-current" />
                          </div>
                        )}
                        
                        {/* Info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                          <h4 className="font-medium text-sm mb-1">{stockImage.title}</h4>
                          <p className="text-xs opacity-90">by {stockImage.photographer}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {stockImage.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : stockSearchQuery ? (
                <div className="text-center py-12">
                  <Search size={48} className="mx-auto text-neutral-300 mb-4" />
                  <p className="text-neutral-500">No results found for "{stockSearchQuery}"</p>
                  <p className="text-sm text-neutral-400 mt-2">Try different keywords or search terms</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles size={48} className="mx-auto text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-800 mb-2">Search Stock Photos</h3>
                  <p className="text-neutral-500 mb-4">
                    Enter keywords to find professional stock photos for your content
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['business', 'technology', 'teamwork', 'office', 'meeting', 'innovation'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setStockSearchQuery(suggestion);
                          handleStockPhotoSearch();
                        }}
                        className="px-3 py-1 text-sm bg-neutral-100 text-neutral-700 rounded-full hover:bg-neutral-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with download button */}
            {selectedStockImage && (
              <div className="p-6 border-t border-neutral-200 bg-neutral-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedStockImage.thumbnail}
                      alt={selectedStockImage.title}
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                    <div>
                      <h4 className="font-medium text-neutral-800">{selectedStockImage.title}</h4>
                      <p className="text-sm text-neutral-500">by {selectedStockImage.photographer} • {selectedStockImage.source}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownloadStockImage(selectedStockImage)}
                    isLoading={isDownloadingStock}
                    leftIcon={<Download size={18} />}
                  >
                    {isDownloadingStock ? 'Adding to Gallery...' : 'Add to Gallery'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-6">Upload Media</h2>
              
              <div
                className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
              >
                <Upload className="mx-auto h-12 w-12 text-neutral-400" />
                <h3 className="mt-2 text-sm font-medium text-neutral-900">
                  Drag & drop files here
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  or click to browse files
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                >
                  Browse Files
                </Button>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </Button>
                <Button>
                  Upload Files
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-neutral-800">Edit Image</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 hover:bg-neutral-100 rounded-full"
                >
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="rounded-lg overflow-hidden mb-4">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.title}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="text-sm text-neutral-500">
                    <p>Uploaded on {new Date(selectedImage.created_at).toLocaleDateString()}</p>
                    <p>Type: {selectedImage.type || 'Image'}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Input
                      label="Title"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      fullWidth
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editedTags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-neutral-100"
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
                        onKeyPress={(e) => {
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
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center border-t border-neutral-200 pt-6">
                <Button
                  variant="outline"
                  className="text-error-600 hover:bg-error-50 hover:border-error-600"
                  leftIcon={<Trash2 size={18} />}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Image
                </Button>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    isLoading={isSaving}
                  >
                    Save Changes
                  </Button>
                </div>
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
              <h2 className="text-xl font-bold text-neutral-800 mb-4">Delete Image</h2>
              <p className="text-neutral-600 mb-6">
                Are you sure you want to delete this image? This action cannot be undone.
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

export default Gallery;