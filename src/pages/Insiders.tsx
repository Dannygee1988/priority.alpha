Here's the fixed version with all closing brackets added:

```typescript
                    value={newSounding.type}
                    onChange={(e) => setNewSounding({ ...newSounding, type: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="Inside Information">Inside Information</option>
                    <option value="Market Sounding">Market Sounding</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newSounding.description}
                    onChange={(e) => setNewSounding({ ...newSounding, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Enter description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Expected Cleanse Date
                  </label>
                  <input
                    type="date"
                    value={newSounding.expected_cleanse_date}
                    onChange={(e) => setNewSounding({ ...newSounding, expected_cleanse_date: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSoundingModal(false);
                    setNewSounding({
                      subject: '',
                      description: '',
                      project_name: '',
                      type: 'Inside Information',
                      expected_cleanse_date: ''
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSounding}
                  disabled={!newSounding.subject || !newSounding.project_name}
                >
                  Add Market Sounding
                </Button>
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
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-error-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-error-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-neutral-900">Delete Market Sounding</h3>
                  <p className="text-sm text-neutral-500">
                    Are you sure you want to delete this market sounding? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSoundingToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="error"
                  onClick={handleDeleteSounding}
                  loading={isDeleting}
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

export default Insiders;
```