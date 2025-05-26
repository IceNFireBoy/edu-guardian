import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBookOpen } from 'react-icons/fa';
import { useNote } from './useNote';
import { Note, NoteFilter as NoteFilterType } from '../types/note';
import FilterForm from './components/FilterForm';
import NoteCard from './NoteCard';
import NoteDetailModal from './components/NoteDetailModal';
import { subjectColors } from './NoteCard'; // For subjects list, can be moved to a shared config
import { toast } from 'react-hot-toast';

// Extract subject names for the filter form
const subjectsArray = Object.keys(subjectColors).filter(key => key !== 'default');

const EmptyState: React.FC<{ hasFilters: boolean; onClearFilters: () => void }> = ({ hasFilters, onClearFilters }) => (
  <div className="text-center py-8 sm:py-12 px-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
    <FaBookOpen className="text-4xl sm:text-5xl text-gray-400 dark:text-gray-500 mx-auto mb-4" />
    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
      {hasFilters ? "No Notes Found" : "Start Exploring Notes"}
    </h3>
    <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
      {hasFilters 
        ? "No notes match your selected filters. Try adjusting your search criteria or upload new notes."
        : "Use the filters above to find specific notes, or browse all available notes."}
    </p>
    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
      {hasFilters && (
        <button 
          onClick={onClearFilters} 
          className="w-full sm:w-auto btn bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Clear All Filters
        </button>
      )}
      {/* TODO: Link to actual upload page/modal if NoteUploader is used elsewhere or integrated here */}
      {/* <a href="/upload-note" className="w-full sm:w-auto btn btn-primary inline-block">
        Upload New Notes
      </a> */}
    </div>
  </div>
);

const NoteFilterPage: React.FC = () => {
  const { fetchNotes, loading, error } = useNote();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filters, setFilters] = useState<NoteFilterType>({
    subject: '',
    grade: '',
    semester: '',
    quarter: '',
    topic: '', // Retained for compatibility if FilterForm uses it, though it should use searchQuery
    searchQuery: '',
    tags: [],
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasActiveFilters = useCallback(() => {
    return Object.values(filters).some(value => 
        Array.isArray(value) ? value.length > 0 : value !== '' && value !== 'date' && value !== 'desc'
    );
  }, [filters]);

  const loadNotes = useCallback(async () => {
    const fetchedNotes = await fetchNotes(filters);
    setNotes(fetchedNotes.data);
    if (error) {
      toast.error(`Failed to fetch notes: ${error}`);
    }
  }, [fetchNotes, filters, error]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]); // Dependencies: loadNotes will change if fetchNotes or filters change

  const handleApplyFilters = () => {
    loadNotes(); // Re-fetch notes when filters are explicitly applied
  };

  const handleClearFilters = () => {
    setFilters({
      subject: '',
      grade: '',
      semester: '',
      quarter: '',
      topic: '',
      searchQuery: '',
      tags: [],
      sortBy: 'date',
      sortOrder: 'desc'
    });
    // `loadNotes` will be called by useEffect due to `filters` changing
  };

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
    // Increment view count (Ideally backend does this, or call a hook function)
    // For now, simulate a client-side update for immediate feedback if desired
    // const updatedNote = { ...note, viewCount: (note.viewCount || 0) + 1 };
    // setNotes(prev => prev.map(n => n.id === note.id ? updatedNote : n));
    // setSelectedNote(updatedNote);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNote(null);
  };

  const handleNoteUpdate = (updatedNote: Note) => {
    setNotes(prevNotes => prevNotes.map(n => n._id === updatedNote._id ? updatedNote : n));
    if (selectedNote && selectedNote._id === updatedNote._id) {
      setSelectedNote(updatedNote);
    }
  };

  const handleNoteDelete = (deletedNoteId: string) => {
    setNotes(prevNotes => prevNotes.filter(n => n._id !== deletedNoteId));
    if (selectedNote && selectedNote._id === deletedNoteId) {
      setSelectedNote(null);
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6">
      <FilterForm 
        filters={filters} 
        setFilters={setFilters} 
        onSubmit={handleApplyFilters} 
        hasFiltersApplied={hasActiveFilters()} 
        clearAllFilters={handleClearFilters}
        subjects={subjectsArray}
      />

      {loading && <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading notes...</div>}
      {!loading && error && <div className="text-center py-10 text-red-500">Error loading notes: {error}</div>}
      
      {!loading && !error && notes.length === 0 && (
        <EmptyState hasFilters={hasActiveFilters()} onClearFilters={handleClearFilters} />
      )}

      {!loading && !error && notes.length > 0 && (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          <AnimatePresence>
            {notes.map(note => (
              <motion.div
                key={note._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <NoteCard 
                  note={note} 
                  onView={() => handleViewNote(note)} 
                  // Pass onRatingChange if NoteCard needs to inform parent of rating hook usage
                  // For now, NoteDetailModal handles rating via its own hook instance
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {selectedNote && (
        <NoteDetailModal 
          note={selectedNote} 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          onNoteUpdate={handleNoteUpdate}
          onNoteDelete={handleNoteDelete}
        />
      )}
    </div>
  );
};

export default NoteFilterPage; 