import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NoteFilter from '../../NoteFilter';

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all filter options', () => {
    render(
      <NoteFilter
        subjects={mockSubjects}
        grades={mockGrades}
        semesters={mockSemesters}
        quarters={mockQuarters}
        topics={mockTopics}
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

  it('populates select options correctly', () => {
    render(
      <NoteFilter
        subjects={mockSubjects}
        grades={mockGrades}
        semesters={mockSemesters}
        quarters={mockQuarters}
        topics={mockTopics}
        onFilterChange={mockOnFilterChange}
        initialFilters={mockInitialFilters}
      />
    );
    
    const subjectSelect = screen.getByLabelText('Subject');
    const gradeSelect = screen.getByLabelText('Grade');
    const semesterSelect = screen.getByLabelText('Semester');
    const quarterSelect = screen.getByLabelText('Quarter');
    const topicSelect = screen.getByLabelText('Topic');
    
    mockSubjects.forEach(subject => {
      expect(subjectSelect).toHaveTextContent(subject);
    });
    
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

  it('calls onFilterChange when subject is changed', () => {
    render(
      <NoteFilter
        subjects={mockSubjects}
        grades={mockGrades}
        semesters={mockSemesters}
        quarters={mockQuarters}
        topics={mockTopics}
        onFilterChange={mockOnFilterChange}
        initialFilters={mockInitialFilters}
      />
    );
    
    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: mockSubjects[0] } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockInitialFilters,
      subject: mockSubjects[0]
    });
  });

  it('calls onFilterChange when grade is changed', () => {
    render(
      <NoteFilter
        subjects={mockSubjects}
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
        subjects={mockSubjects}
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
        subjects={mockSubjects}
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
        subjects={mockSubjects}
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
        subjects={mockSubjects}
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
      subject: mockSubjects[0],
      grade: mockGrades[0],
      semester: mockSemesters[0],
      quarter: mockQuarters[0],
      topic: mockTopics[0],
      searchQuery: 'initial search'
    };
    
    render(
      <NoteFilter
        subjects={mockSubjects}
        grades={mockGrades}
        semesters={mockSemesters}
        quarters={mockQuarters}
        topics={mockTopics}
        onFilterChange={mockOnFilterChange}
        initialFilters={initialFilters}
      />
    );
    
    expect(screen.getByLabelText('Subject')).toHaveValue(initialFilters.subject);
    expect(screen.getByLabelText('Grade')).toHaveValue(initialFilters.grade);
    expect(screen.getByLabelText('Semester')).toHaveValue(initialFilters.semester);
    expect(screen.getByLabelText('Quarter')).toHaveValue(initialFilters.quarter);
    expect(screen.getByLabelText('Topic')).toHaveValue(initialFilters.topic);
    expect(screen.getByPlaceholderText('Search notes...')).toHaveValue(initialFilters.searchQuery);
  });

  it('clears all filters when reset button is clicked', () => {
    const initialFilters = {
      subject: mockSubjects[0],
      grade: mockGrades[0],
      semester: mockSemesters[0],
      quarter: mockQuarters[0],
      topic: mockTopics[0],
      searchQuery: 'initial search'
    };
    
    render(
      <NoteFilter
        subjects={mockSubjects}
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
        subjects={mockSubjects}
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