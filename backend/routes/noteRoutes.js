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

const router = express.Router();

// Debug route - returns all notes without filters
router.get('/test', async (req, res) => {
  try {
    const notes = await Note.find().lean();
    console.log("[Backend] Test route returning", notes.length, "notes");
    return res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error) {
    console.error("[Backend] Test route error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve notes"
    });
  }
});

// Public routes - all routes are now public
router.route('/filter').get(getNotesByFilters);
router.route('/my-notes').get(getMyNotes);
router.route('/user/:userId').get(getUserNotes);
router.route('/top-rated').get(getTopRatedNotes);
router.route('/subject/:subject').get(getNotesBySubject);
router.route('/search').get(searchNotes);
router.route('/upload').post(uploadNoteFile);
router.route('/:id/ratings').post(rateNote);
router.route('/:id/download').put(incrementDownloads);
router.route('/:id/flashcards').post(createFlashcard);

// Main CRUD routes
router
  .route('/')
  .get(getNotes)
  .post(createNote);

router
  .route('/:id')
  .get(getNote)
  .put(updateNote)
  .delete(deleteNote);

module.exports = router; 