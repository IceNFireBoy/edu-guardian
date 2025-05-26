import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NoteFilter from '../../NoteFilter';
import { Note } from '../../noteTypes';

const mockNote: Note = {
  _id: '1',
  title: 'Test Note',
  content: 'Test content',
  subject: 'Math',
  grade: '10th',
  semester: 'Fall',
  quarter: 'Q1',
  topic: 'Algebra',
  isPublic: true,
  fileUrl: 'test.pdf',
  fileType: 'pdf',
  viewCount: 0,
  rating: 0,
  ratingCount: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  user: 'user123'
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
      id: '1',
      title: 'Test Note 1',
      content: 'Test content 1',
      fileUrl: 'http://example.com/test1.pdf',
      fileType: 'application/pdf',
      subject: 'Test Subject',
      grade: 'Test Grade',
      semester: 'Test Semester',
      isPublic: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      viewCount: 0,
      downloadCount: 0,
      averageRating: 0,
      ratings: [],
      flashcards: [],
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com'
      },
      quarter: 'Test Quarter',
      topic: 'Test Topic'
    },
    {
      id: '2',
      title: 'Test Note 2',
      content: 'Test content 2',
      fileUrl: 'http://example.com/test2.pdf',
      fileType: 'application/pdf',
      subject: 'Test Subject',
      grade: 'Test Grade',
      semester: 'Test Semester',
      isPublic: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      viewCount: 0,
      downloadCount: 0,
      averageRating: 0,
      ratings: [],
      flashcards: [],
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com'
      },
      quarter: 'Test Quarter',
      topic: 'Test Topic'
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
        onFilterChange={mockOnFilterChange}
        initialFilters={mockInitialFilters}
      />
    );
    
    expect(screen.getByLabelText('Grade')).toBeInTheDocument();
    expect(screen.getByLabelText('Semester')).toBeInTheDocument();
    expect(screen.getByLabelText('Quarter')).toBeInTheDocument();
    expect(screen.getByLabelText('Topic')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search notes...')).toBeInTheDocument();
  });

  it('populates select options correctly', () => {
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

  it('calls onFilterChange when grade is changed', () => {
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
    
    const gradeSelect = screen.getByLabelText('Grade');
    fireEvent.change(gradeSelect, { target: { value: mockGrades[0] } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockInitialFilters,
      grade: mockGrades[0]
    });
  });

  it('calls onFilterChange when semester is changed', () => {
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
    
    const semesterSelect = screen.getByLabelText('Semester');
    fireEvent.change(semesterSelect, { target: { value: mockSemesters[0] } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockInitialFilters,
      semester: mockSemesters[0]
    });
  });

  it('calls onFilterChange when quarter is changed', () => {
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
    
    const quarterSelect = screen.getByLabelText('Quarter');
    fireEvent.change(quarterSelect, { target: { value: mockQuarters[0] } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockInitialFilters,
      quarter: mockQuarters[0]
    });
  });

  it('calls onFilterChange when topic is changed', () => {
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
    
    const topicSelect = screen.getByLabelText('Topic');
    fireEvent.change(topicSelect, { target: { value: mockTopics[0] } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockInitialFilters,
      topic: mockTopics[0]
    });
  });

  it('calls onFilterChange when search query is changed', () => {
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
    
    const searchInput = screen.getByPlaceholderText('Search notes...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockInitialFilters,
      searchQuery: 'test query'
    });
  });

  it('applies initial filter values', () => {
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
        onFilterChange={mockOnFilterChange}
        initialFilters={initialFilters}
      />
    );
    
    expect(screen.getByLabelText('Grade')).toHaveValue(initialFilters.grade);
    expect(screen.getByLabelText('Semester')).toHaveValue(initialFilters.semester);
    expect(screen.getByLabelText('Quarter')).toHaveValue(initialFilters.quarter);
    expect(screen.getByLabelText('Topic')).toHaveValue(initialFilters.topic);
    expect(screen.getByPlaceholderText('Search notes...')).toHaveValue(initialFilters.searchQuery);
  });

  it('clears all filters when reset button is clicked', () => {
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
        onFilterChange={mockOnFilterChange}
        initialFilters={initialFilters}
      />
    );
    
    fireEvent.click(screen.getByText('Reset Filters'));
    
    expect(mockOnFilterChange).toHaveBeenCalledWith(mockInitialFilters);
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-class';
    render(
      <NoteFilter
        grades={mockGrades}
        semesters={mockSemesters}
        quarters={mockQuarters}
        topics={mockTopics}
        onFilterChange={mockOnFilterChange}
        initialFilters={mockInitialFilters}
        className={customClass}
      />
    );
    
    const filterContainer = screen.getByTestId('note-filter');
    expect(filterContainer).toHaveClass(customClass);
  });
}); 