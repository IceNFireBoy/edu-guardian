const express = require('express');
const {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  getUserNotes,
  getMyNotes,
  addRating,
  downloadNote,
  getTopRatedNotes,
  getNotesBySubject,
  addFlashcards,
  searchNotes,
  uploadNoteFile,
  getNotesByFilters,
  rateNote,
  incrementDownloads,
  createFlashcard
} = require('../controllers/noteController');

const Note = require('../models/Note');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.route('/filter').get(getNotesByFilters); // Adding filter route for public access

// Special routes
// TEMP: Keeping this protected as it's not critical for immediate functionality
router.route('/my-notes').get(protect, getMyNotes);
router.route('/user/:userId').get(getUserNotes);
router.route('/top-rated').get(getTopRatedNotes);
router.route('/subject/:subject').get(getNotesBySubject);
router.route('/search').get(searchNotes);
router.route('/upload').post(protect, uploadNoteFile); // Adding upload file route

// Rating route
// TEMP: Keeping this protected as it's not critical for immediate functionality
router.route('/:id/ratings').post(protect, rateNote);

// Download route
// TEMP: Keeping this protected as it's not critical for immediate functionality
router.route('/:id/download').put(protect, incrementDownloads);

// Flashcards route
// TEMP: Keeping this protected as it's not critical for immediate functionality
router.route('/:id/flashcards').post(protect, createFlashcard);

// Main CRUD routes
router
  .route('/')
  .get(
    advancedResults(Note, {
      path: 'user',
      select: 'name username profileImage'
    }),
    getNotes
  )
  .post(protect, createNote);

router
  .route('/:id')
  .get(getNote)
  .put(protect, updateNote)
  .delete(protect, deleteNote);

module.exports = router; 