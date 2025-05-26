import React, { useState, useEffect } from 'react';
import { NoteFilter as FilterType } from '../../../types/note';

interface NoteFilterProps {
  onFilterChange: (filter: FilterType) => void;
  initialFilters?: FilterType;
  className?: string;
  grades: string[];
  semesters: string[];
  quarters: string[];
  topics: string[];
  subjects?: string[];
}

export const NoteFilter: React.FC<NoteFilterProps> = ({ 
  onFilterChange, 
  initialFilters,
  className,
  grades,
  semesters,
  quarters,
  topics,
  subjects = []
}) => {
  const [filters, setFilters] = useState<FilterType>(initialFilters || {});

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  const handleFilterChange = (key: keyof FilterType, value: string | boolean) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const removeFilter = (key: keyof FilterType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  return (
    <div className={`space-y-4 ${className || ''}`} data-testid="note-filter">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Subject</label>
          {subjects.length > 0 ? (
            <select
              value={filters.subject || ''}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={filters.subject || ''}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              placeholder="Enter subject..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Grade</label>
          <select
            value={filters.grade || ''}
            onChange={(e) => handleFilterChange('grade', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Grades</option>
            {grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Semester</label>
          <select
            value={filters.semester || ''}
            onChange={(e) => handleFilterChange('semester', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Semesters</option>
            {semesters.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Quarter</label>
          <select
            value={filters.quarter || ''}
            onChange={(e) => handleFilterChange('quarter', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Quarters</option>
            {quarters.map((quarter) => (
              <option key={quarter} value={quarter}>
                {quarter}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Topic</label>
          <select
            value={filters.topic || ''}
            onChange={(e) => handleFilterChange('topic', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Topics</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.isPublic || false}
              onChange={(e) => handleFilterChange('isPublic', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Public Notes Only</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Search</label>
        <input
          type="text"
          value={filters.searchQuery || ''}
          onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          placeholder="Search notes..."
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => (
            <div
              key={key}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              <span>{`${key}: ${value}`}</span>
              <button
                onClick={() => removeFilter(key as keyof FilterType)}
                className="ml-2 text-blue-600 hover:text-blue-800"
                aria-label={`Remove ${key} filter`}
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={resetFilters}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            Reset All
          </button>
        </div>
      )}
    </div>
  );
}; 