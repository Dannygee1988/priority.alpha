Here's the fixed version with all missing closing brackets added:

```javascript
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    value={editedContact.company_name}
                    onChange={(e) => setEditedContact({ ...editedContact, company_name: e.target.value })}
                  />
                  <Input
                    label="Job Title"
                    value={editedContact.job_title}
                    onChange={(e) => setEditedContact({ ...editedContact, job_title: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedContact(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  loading={isSaving}
                >
                  Save Changes
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