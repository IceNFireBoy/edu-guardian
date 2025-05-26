import React from 'react';
import { FaFilter, FaSearch } from 'react-icons/fa';
import { NoteFilter as NoteFilterType } from '../../types/note';

interface FilterFormProps {
  filters: NoteFilterType;
  setFilters: React.Dispatch<React.SetStateAction<NoteFilterType>>;
  onSubmit: () => void;
  hasFiltersApplied: boolean;
  clearAllFilters: () => void;
  subjects: string[];
}

const FilterForm: React.FC<FilterFormProps> = ({ 
  filters, 
  setFilters, 
  onSubmit, 
  hasFiltersApplied, 
  clearAllFilters, 
  subjects 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6 mb-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-100">
        <FaFilter className="mr-2 text-primary dark:text-primary-light" /> Filter Notes
      </h2>
      
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="grade-select">Grade</label>
          <select 
            id="grade-select"
            name="grade"
            value={filters.grade || ''}
            onChange={handleChange}
            className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
            aria-label="Select grade"
          >
            <option value="">All Grades</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="semester-select">Semester</label>
          <select 
            id="semester-select"
            name="semester"
            value={filters.semester || ''}
            onChange={handleChange}
            className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
            aria-label="Select semester"
          >
            <option value="">All Semesters</option>
            <option value="Semester 1">1st Semester</option>
            <option value="Semester 2">2nd Semester</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="quarter-select">Quarter</label>
          <select 
            id="quarter-select"
            name="quarter"
            value={filters.quarter || ''}
            onChange={handleChange}
            className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
            aria-label="Select quarter"
          >
            <option value="">All Quarters</option>
            <option value="Quarter 1">Q1</option>
            <option value="Quarter 2">Q2</option>
            <option value="Quarter 3">Q3</option>
            <option value="Quarter 4">Q4</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="subject-select">Subject</label>
          <select 
            id="subject-select"
            name="subject"
            value={filters.subject || ''}
            onChange={handleChange}
            className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
            aria-label="Select subject"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mt-4">
        <label htmlFor="searchQuery-input" className="block text-gray-700 dark:text-gray-300 mb-2">Search by Topic or Keywords</label>
        <div className="relative">
          <input
            id="searchQuery-input"
            type="text"
            name="searchQuery" // Changed from topic to searchQuery to match NoteFilterType
            value={filters.searchQuery || ''}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search by topic or keywords..."
            className="w-full input pl-10 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            aria-label="Search by topic or keywords"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="tags-input">Filter by Tags (comma-separated)</label>
        <input
            id="tags-input"
            type="text"
            name="tags"
            value={Array.isArray(filters.tags) ? filters.tags.join(', ') : ''}
            onChange={(e) => setFilters(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) }))}
            onKeyDown={handleKeyDown}
            placeholder="e.g., important, exam, chapter1"
            className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            aria-label="Filter by tags"
        />
      </div>
      
        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
          {hasFiltersApplied && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="w-full sm:w-auto btn bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              aria-label="Clear filters"
            >
              Clear All Filters
            </button>
          )}
        <button
          type="submit"
          className="w-full sm:w-auto btn btn-primary"
          aria-label="Apply filters"
        >
          Apply Filters
        </button>
      </div>
      </form>
    </div>
  );
};

export default FilterForm; 