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
  searchNotes
} = require('../controllers/noteController');

const Note = require('../models/Note');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Special routes
router.route('/my-notes').get(protect, getMyNotes);
router.route('/user/:userId').get(getUserNotes);
router.route('/top-rated').get(getTopRatedNotes);
router.route('/subject/:subject').get(getNotesBySubject);
router.route('/search').get(searchNotes);

// Rating route
router.route('/:id/ratings').post(protect, addRating);

// Download route
router.route('/:id/download').put(protect, downloadNote);

// Flashcards route
router.route('/:id/flashcards').post(protect, addFlashcards);

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