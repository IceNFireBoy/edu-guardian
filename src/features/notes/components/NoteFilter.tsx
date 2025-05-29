import { NoteFilter as NoteFilterType } from 'types/note';

interface NoteFilterProps {
  onFilterChange: (filters: NoteFilterType) => void;
  initialFilters?: Partial<NoteFilterType>;
}

export const NoteFilter: React.FC<NoteFilterProps> = ({ onFilterChange, initialFilters = {} }) => {
  // ... existing code ...
} 