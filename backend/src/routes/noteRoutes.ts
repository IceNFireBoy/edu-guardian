import express from 'express';
import NoteController from '../controllers/NoteController';
import { protect, authorize } from '../middleware/auth';
import { body, param, query } from 'express-validator';
import Note from '../models/Note'; // Keep for the test route for now

const router = express.Router();
const noteController = new NoteController();

// Debug route - returns all notes without filters
router.get('/test/all', async (req, res) => {
  try {
    const notes = await Note.find().lean();
    return res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve notes"
    });
  }
});

// Public routes
router.get('/', [
    query('grade').optional().isString(),
    query('subject').optional().isString(),
    query('semester').optional().isString(),
    query('quarter').optional().isString(),
    query('topic').optional().isString(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], noteController.getNotes);

router.get('/search', [
    query('term').notEmpty().withMessage('Search term is required').isString()
], noteController.searchNotes);

router.get('/subject/:subjectName', [
    param('subjectName').notEmpty().isString()
], noteController.getNotesBySubject);

router.get('/top-rated', noteController.getTopRatedNotes);

router.get('/user/:userId', [
    param('userId').isMongoId().withMessage('Invalid user ID')
], noteController.getUserNotes);

router.get('/:id', [
    param('id').isMongoId().withMessage('Invalid note ID')
], noteController.getNoteById);

// Protected routes - require authentication
router.post('/', protect, [
    body('title').notEmpty().withMessage('Title is required').isString().trim(),
    body('subject').notEmpty().withMessage('Subject is required').isString(),
    body('grade').notEmpty().withMessage('Grade is required').isIn(['11', '12']),
    body('semester').notEmpty().withMessage('Semester is required').isIn(['1', '2']),
    body('quarter').notEmpty().withMessage('Quarter is required').isIn(['1', '2', '3', '4']),
    body('topic').notEmpty().withMessage('Topic is required').isString().trim(),
    body('fileUrl').notEmpty().withMessage('File URL is required').isURL(),
    body('fileType').notEmpty().withMessage('File type is required').isString(),
    body('fileSize').notEmpty().withMessage('File size is required').isNumeric(),
    body('description').optional().isString().trim(),
    body('tags').optional().isArray(),
    body('tags.*').optional().isString().trim()
], noteController.createNote);

// Assuming uploadNoteFile is a distinct action, perhaps for pre-signed URLs or direct uploads handling.
// If it's part of createNote or updateNote, it might be handled differently.
router.post('/upload', protect, noteController.uploadNoteFile);

router.get('/my-notes', protect, noteController.getMyNotes);

router.put('/:id', protect, [
    param('id').isMongoId().withMessage('Invalid note ID'),
    body('title').optional().isString().trim(),
    body('subject').optional().isString(),
    // Add other updatable fields with validation
], noteController.updateNoteById);

router.delete('/:id', protect, [
    param('id').isMongoId().withMessage('Invalid note ID')
], noteController.deleteNoteById);

router.post('/:id/ratings', protect, [
    param('id').isMongoId().withMessage('Invalid note ID'),
    body('value').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], noteController.rateNote);

router.put('/:id/download', protect, [
    param('id').isMongoId().withMessage('Invalid note ID')
], noteController.incrementDownloads);

// Flashcards for a specific note
// The addFlashcardsToNote route was more for bulk adding, createFlashcardForNote for individual
router.post('/:id/flashcards', protect, [
    param('id').isMongoId().withMessage('Invalid note ID'),
    body('question').notEmpty().isString(),
    body('answer').notEmpty().isString(),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard'])
], noteController.createFlashcardForNote); 
// If addFlashcardsToNote (for bulk) is still needed, it can be added as a separate route or logic within createFlashcardForNote can handle arrays.

// AI Feature Routes
router.post('/:id/summarize', protect, [
    param('id').isMongoId().withMessage('Invalid note ID')
], noteController.generateAISummaryForNote);

router.post('/:id/generate-flashcards', protect, [
    param('id').isMongoId().withMessage('Invalid note ID')
], noteController.generateAIFlashcardsForNote);

// New route for saving AI-generated flashcards after user preview/confirmation
router.post('/:id/save-ai-flashcards', protect, [
    param('id').isMongoId().withMessage('Invalid note ID'),
    body('flashcards').isArray({ min: 1 }).withMessage('Flashcards must be a non-empty array'),
    body('flashcards.*'.question').notEmpty().isString().withMessage('Each flashcard must have a question'),
    body('flashcards.*'.answer').notEmpty().isString().withMessage('Each flashcard must have an answer'),
    body('flashcards.*'.difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level')
], noteController.saveAIGeneratedFlashcards);

export default router; 