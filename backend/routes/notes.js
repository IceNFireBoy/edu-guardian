const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

/**
 * @route   GET /api/notes
 * @desc    Get all notes
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/notes/filter
 * @desc    Filter notes by criteria
 * @access  Public
 */
router.get('/filter', async (req, res) => {
  try {
    const { grade, subject, semester, quarter, topic } = req.query;
    
    // Build filter query
    const query = {};
    if (grade) query.grade = grade;
    if (subject) query.subject = subject;
    if (semester) query.semester = semester;
    if (quarter) query.quarter = quarter;
    if (topic) query.topic = { $regex: topic, $options: 'i' }; // Case-insensitive search
    
    const notes = await Note.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (err) {
    console.error('Error filtering notes:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/notes/:id
 * @desc    Get a single note by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    res.json({ success: true, note });
  } catch (err) {
    console.error('Error fetching note:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

/**
 * @route   POST /api/notes
 * @desc    Create a new note
 * @access  Public (should be protected in production)
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      grade,
      subject,
      topic,
      semester,
      quarter,
      fileUrl,
      fileType,
      cloudinaryPublicId,
      uploader
    } = req.body;
    
    // Validate required fields
    if (!title || !grade || !subject || !topic || !semester || !quarter || !fileUrl || !fileType) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields' 
      });
    }
    
    const newNote = new Note({
      title,
      description: description || '',
      grade,
      subject,
      topic,
      semester,
      quarter,
      fileUrl,
      fileType,
      cloudinaryPublicId: cloudinaryPublicId || '',
      uploader: uploader || 'anonymous'
    });
    
    const savedNote = await newNote.save();
    
    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note: savedNote
    });
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

/**
 * @route   POST /api/notes/:id/rate
 * @desc    Rate a note
 * @access  Public (should be protected in production)
 */
router.post('/:id/rate', async (req, res) => {
  try {
    const { userId, rating } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    
    // Add rating using the schema method
    await note.addRating(userId || 'anonymous', rating);
    
    res.json({
      success: true,
      message: 'Rating added successfully',
      averageRating: note.averageRating,
      ratingCount: note.ratingCount
    });
  } catch (err) {
    console.error('Error rating note:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete a note (for future admin features)
 * @access  Private (admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    
    await note.remove();
    
    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router; 