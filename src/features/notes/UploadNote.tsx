import { Note, NoteUploadData } from 'types/note';
import { useState } from 'react';

const [formData, setFormData] = useState<Partial<NoteUploadData>>({
  // ... existing code ...
});

// Fix the setFormData callbacks
setFormData((prev: Partial<NoteUploadData>) => ({ ...prev, [name]: value }));

const completeFormData: NoteUploadData = {
  // ... existing code ...
};

// Fix the tags and isPublic handlers
onChange={(e) => setFormData((prev: Partial<NoteUploadData>) => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()) }))}
onChange={(e) => setFormData((prev: Partial<NoteUploadData>) => ({ ...prev, isPublic: e.target.checked }))}
// ... existing code ... 