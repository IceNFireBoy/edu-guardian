interface NoteFilterProps {
  onFilterChange: (filter: NoteFilter) => void;
  initialFilters?: NoteFilter;
  className?: string;
  grades: string[];
  semesters: string[];
  quarters: string[];
  topics: string[];
}

interface Filters {
  [key: string]: string | number | boolean | undefined;
  subject?: string;
  grade?: string;
  semester?: string;
  quarter?: string;
  topic?: string;
  searchQuery?: string;
}

const handleFilterChange = (key: keyof Filters, value: string | undefined) => {
  const newFilters = { ...filters, [key]: value };
  setFilters(newFilters);
  onFilterChange(newFilters as NoteFilter);
}; 