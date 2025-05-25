import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useNote } from './useNote';
import { Note, NoteFilter } from './noteTypes';
import PDFViewer from './PDFViewer';
import NoteDetails from './NoteDetails';
import NoteCard from './NoteCard';
import UserStats from '../../components/UserStats';
import Leaderboard from '../../components/Leaderboard';
import Notifications from '../../components/Notifications';

const NotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchNotes, loading, error } = useNote();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'pdf'>('list');
  const [userAchievements, setUserAchievements] = useState<any[]>([]);
  const [filters, setFilters] = useState<NoteFilter>({
    subject: '',
    grade: '',
    semester: '',
    quarter: '',
    searchQuery: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  useEffect(() => {
    loadNotes();
    if (user) {
      fetchUserData();
    }
  }, [filters, pagination.page, user]);

  const loadNotes = async () => {
    const fetchedNotes = await fetchNotes(filters);
    setNotes(fetchedNotes.data);
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/v1/users/profile');
      const data = await response.json();
      setUserAchievements(data.data.achievements);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setViewMode('details');
  };

  const handleViewPDF = () => {
    setViewMode('pdf');
  };

  const handleBackToList = () => {
    setSelectedNote(null);
    setViewMode('list');
  };

  const handleRatingChange = async (noteId: string, rating: number) => {
    setNotes(prevNotes => prevNotes.map(note => note.id === noteId ? { ...note, averageRating: rating } : note));
    if (user) await fetchUserData();
  };

  const handleFlashcardSubmit = async (updatedNote: Note) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === updatedNote.id ? updatedNote : note
      )
    );
    setSelectedNote(updatedNote);
    if (user) {
      await fetchUserData();
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Utility to map user to UserStatsData
  const mapUserToUserStatsData = (user: any): any => ({
    xp: user?.xp || 0,
    currentStreak: user?.streak?.current || 0,
    recentActivity: user?.recentActivity || [],
    achievements: user?.achievements || [],
  });

  if (viewMode === 'pdf' && selectedNote) {
    return (
      <div className="h-screen">
        <PDFViewer
          fileUrl={selectedNote.fileUrl}
          onLoad={async () => {
            await fetch(`/api/v1/notes/${selectedNote.id}/view`, { method: 'POST' });
            if (user) {
              await fetchUserData();
            }
          }}
        />
        <button
          onClick={() => setViewMode('details')}
          className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded"
        >
          Close PDF
        </button>
      </div>
    );
  }

  if (viewMode === 'details' && selectedNote) {
    const hasPDF = !!selectedNote.fileUrl;
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={handleBackToList}
          className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to List
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <NoteDetails
              noteId={selectedNote.id}
              onClose={handleBackToList}
            />
            {!hasPDF && (
              <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded border border-yellow-300">
                <strong>Warning:</strong> No PDF file is attached to this note. You can still use all AI features below.
              </div>
            )}
            <button
              onClick={handleViewPDF}
              className={`mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${!hasPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!hasPDF}
            >
              View PDF
            </button>
          </div>
          <div>
            {user && <UserStats user={mapUserToUserStatsData(user)} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Study Notes</h1>
            <div className="flex flex-wrap gap-4 mb-6">
              <select
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                <option value="mathematics">Mathematics</option>
                <option value="science">Science</option>
                <option value="english">English</option>
                <option value="history">History</option>
              </select>
              <select
                name="grade"
                value={filters.grade}
                onChange={handleFilterChange}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Grades</option>
                <option value="grade7">Grade 7</option>
                <option value="grade8">Grade 8</option>
                <option value="grade9">Grade 9</option>
                <option value="grade10">Grade 10</option>
              </select>
              <select
                name="semester"
                value={filters.semester}
                onChange={handleFilterChange}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
              <select
                name="quarter"
                value={filters.quarter}
                onChange={handleFilterChange}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Quarters</option>
                <option value="1">Quarter 1</option>
                <option value="2">Quarter 2</option>
                <option value="3">Quarter 3</option>
                <option value="4">Quarter 4</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onView={() => handleNoteClick(note)}
                />
              ))}
            </div>
            {loading && <div className="text-center py-4">Loading...</div>}
            {error && <div className="text-red-500 text-center py-4">{error}</div>}
          </div>
        </div>
        <div>
          <Leaderboard />
          <Notifications />
        </div>
      </div>
    </div>
  );
};

export default NotesPage; 