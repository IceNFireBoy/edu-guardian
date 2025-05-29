import { Note, NoteFilter as NoteFilterType } from 'types/note';
import { useState } from 'react';

const [filters, setFilters] = useState<NoteFilterType>({
  // ... existing code ...
});

// Fix the setFilters callback
setFilters((prev: NoteFilterType) => ({
  // ... existing code ...
}));
// ... existing code ... 