import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NoteFilter } from '../NoteFilter';
import { Note } from '../../../../types/note';

const mockNote: Note = {
  _id: '1',
  title: 'Test Note',
  content: 'Test Content',
  description: 'A test note',
  fileUrl: 'http://example.com/file.pdf',
  fileType: 'pdf',
  fileSize: 1024,
  subject: 'Math',
  grade: '11',
  semester: '1',
  quarter: '1',
  topic: 'Algebra',
  tags: ['math'],
  viewCount: 10,
  downloadCount: 2,
  ratings: [],
  averageRating: 4.5,
  aiSummary: '',
  aiSummaryKeyPoints: [],
  flashcards: [],
  user: 'user123',
  isPublic: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  rating: 4.5,
  ratingCount: 10
};

describe('NoteFilter', () => {
  const mockSubjects = ['Mathematics', 'Science', 'English'];
  const mockGrades = ['9', '10', '11', '12'];
  const mockSemesters = ['1', '2'];
  const mockQuarters = ['1', '2', '3', '4'];
  const mockTopics = ['Algebra', 'Geometry', 'Calculus'];

  const mockOnFilterChange = vi.fn();
  const mockInitialFilters = {
    subject: '',
    grade: '',
    semester: '',
    quarter: '',
    topic: '',
    searchQuery: ''
  };

  const mockNotesFilter: Note[] = [
    {
      _id: '1',
      title: 'Test Note 1',
      content: 'Test content 1',
      description: 'Test content 1',
      fileUrl: 'http://example.com/test1.pdf',
      fileType: 'pdf',
      fileSize: 1024,
      subject: 'Test Subject',
      grade: '11',
      semester: '1',
      quarter: '1',
      topic: 'Test Topic',
      tags: ['test'],
      viewCount: 0,
      downloadCount: 0,
      ratings: [],
      averageRating: 0,
      aiSummary: '',
      aiSummaryKeyPoints: [],
      flashcards: [],
      user: 'user123',
      isPublic: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      rating: 0,
      ratingCount: 0
    },
    {
      _id: '2',
      title: 'Test Note 2',
      content: 'Test content 2',
      description: 'Test content 2',
      fileUrl: 'http://example.com/test2.pdf',
      fileType: 'pdf',
      fileSize: 1024,
      subject: 'Test Subject',
      grade: '12',
      semester: '2',
      quarter: '2',
      topic: 'Test Topic',
      tags: ['test'],
      viewCount: 0,
      downloadCount: 0,
      ratings: [],
      averageRating: 0,
      aiSummary: '',
      aiSummaryKeyPoints: [],
      flashcards: [],
      user: 'user123',
      isPublic: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      rating: 0,
      ratingCount: 0
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all filter options', () => {
    render(
      <NoteFilter
        grades={mockGrades}
        semesters={mockSemesters}
        quarters={mockQuarters}
        topics={mockTopics}
        subjects={mockSubjects}
        onFilterChange={mockOnFilterChange}
        initialFilters={mockInitialFilters}
      />
    );
    
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Grade')).toBeInTheDocument();
    expect(screen.getByLabelText('Semester')).toBeInTheDocument();
    expect(screen.getByLabelText('Quarter')).toBeInTheDocument();
    expect(screen.getByLabelText('Topic')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search notes...')).toBeInTheDocument();
  });

  it('renders subject as select when subjects array is provided', () => {
    render(
      <NoteFilter
        grades={mockGrades}
        semesters={mockSemesters}
        quarters={mockQuarters}
        topics={mockTopics}
        subjects={mockSubjects}
        onFilterChange={mockOnFilterChange}
        initialFilters={mockInitialFilters}
      />
    );
    
    const subjectSelect = screen.getByLabelText('Subject');
    expect(subjectSelect.tagName).toBe('SELECT');
    mockSubjects.forEach(subject => {
      expect(subjectSelect).toHaveTextContent(subject);
    });
  });

  it('renders subject as input when no subjects array is provided', () => {
    render(
      <NoteFilter
        grades={mockGrades}
        semesters={mockSemesters}
        quarters={mockQuarters}
        topics={mockTopics}
        onFilterChange={mockOnFilterChange}
        initialFilters={mockInitialFilters}
      />
    );
    
    const subjectInput = screen.getByLabelText('Subject');
    expect(subjectInput.tagName).toBe('INPUT');
    expect(subjectInput).toHaveAttribute('placeholder', 'Enter subject...');
  });

  it('populates select options correctly', () => {
    render(
      <NoteFilter
        grades={mockGrades}
        semesters={mockSemesters}
        quarters={mockQuarters}
        topics={mockTopics}
        subjects={mockSubjects}
        onFilterChange={mockOnFilterChange}
        initialFilters={mockInitialFilters}
      />
    );
    
    const gradeSelect = screen.getByLabelText('Grade');
    const semesterSelect = screen.getByLabelText('Semester');
    const quarterSelect = screen.getByLabelText('Quarter');
    const topicSelect = screen.getByLabelText('Topic');
    
    mockGrades.forEach(grade => {
      expect(gradeSelect).toHaveTextContent(grade);
    });
    
    mockSemesters.forEach(semester => {
      expect(semesterSelect).toHaveTextContent(semester);
    });
    
    mockQuarters.forEach(quarter => {
      expect(quarterSelect).toHaveTextContent(quarter);
    });
    
    mockTopics.forEach(topic => {
      expect(topicSelect).toHaveTextContent(topic);
    });
  });

  it('calls onFilterChange when filters are changed', () => {
    render(
      <NoteFilter
        grades={mockGrades}
        semesters={mockSemesters}
        quarters={mockQuarters}
        topics={mockTopics}
        subjects={mockSubjects}
        onFilterChange={mockOnFilterChange}
        initialFilters={mockInitialFilters}
      />
    );
    
    const gradeSelect = screen.getByLabelText('Grade');
    fireEvent.change(gradeSelect, { target: { value: mockGrades[0] } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockInitialFilters,
      grade: mockGrades[0]
    });
  });

  it('removes filter when remove button is clicked', () => {
    const initialFilters = {
      ...mockInitialFilters,
      grade: mockGrades[0]
    };
    
    render(
      <NoteFilter
        grades={mockGrades}
        semesters={mockSemesters}
        quarters={mockQuarters}
        topics={mockTopics}
        subjects={mockSubjects}
        onFilterChange={mockOnFilterChange}
        initialFilters={initialFilters}
      />
    );
    
    const removeButton = screen.getByLabelText('Remove grade filter');
    fireEvent.click(removeButton);
    
    expect(mockOnFilterChange).toHaveBeenCalledWith(mockInitialFilters);
  });

  it('resets all filters when reset button is clicked', () => {
    const initialFilters = {
      grade: mockGrades[0],
      semester: mockSemesters[0],
      quarter: mockQuarters[0],
      topic: mockTopics[0],
      searchQuery: 'initial search'
    };
    
    render(
      <NoteFilter
        grades={mockGrades}
        semesters={mockSemesters}
        quarters={mockQuarters}
        topics={mockTopics}
        subjects={mockSubjects}
        onFilterChange={mockOnFilterChange}
        initialFilters={initialFilters}
      />
    );
    
    const resetButton = screen.getByText('Reset All');
    fireEvent.click(resetButton);
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({});
  });

  it('updates filters when initialFilters prop changes', () => {
    const { rerender } = render(
      <NoteFilter
        grades={mockGrades}
        semesters={mockSemesters}
        quarters={mockQuarters}
        topics={mockTopics}
        subjects={mockSubjects}
        onFilterChange={mockOnFilterChange}
        initialFilters={mockInitialFilters}
      />
    );
    
    const newInitialFilters = {
      ...mockInitialFilters,
      grade: mockGrades[1]
    };
    
    rerender(
      <NoteFilter
        grades={mockGrades}
        semesters={mockSemesters}
        quarters={mockQuarters}
        topics={mockTopics}
        subjects={mockSubjects}
        onFilterChange={mockOnFilterChange}
        initialFilters={newInitialFilters}
      />
    );
    
    expect(screen.getByLabelText('Grade')).toHaveValue(mockGrades[1]);
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-class';
    render(
      <NoteFilter
        grades={mockGrades}
        semesters={mockSemesters}
        quarters={mockQuarters}
        topics={mockTopics}
        subjects={mockSubjects}
        onFilterChange={mockOnFilterChange}
        initialFilters={mockInitialFilters}
        className={customClass}
      />
    );
    
    const filterContainer = screen.getByTestId('note-filter');
    expect(filterContainer).toHaveClass(customClass);
  });
}); 