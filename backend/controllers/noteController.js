const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Note = require('../models/Note');
const User = require('../models/User');

// @desc    Get all notes
// @route   GET /api/v1/notes
// @access  Public
exports.getNotes = async (req, res) => {
  try {
    // Create filter object for MongoDB query
    const filter = {};
    
    // Add query parameters to filter if they exist
    if (req.query.grade) filter.grade = req.query.grade;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.semester) filter.semester = req.query.semester;
    if (req.query.quarter) filter.quarter = req.query.quarter;
    
    // For topic, use regex for partial matching
    if (req.query.topic) {
      filter.topic = new RegExp(req.query.topic, 'i');
    }
    
    console.log("[Backend] Filtering notes with query:", req.query);
    console.log("[Backend] Using filter:", filter);
    
    // Find notes matching filter criteria
    const notes = await Note.find(filter);
    console.log("[Backend] Found", notes.length, "notes matching criteria");
    
    // Return notes as JSON array
    return res.status(200).json(notes);
  } catch (error) {
    console.error("MongoDB Filter Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to retrieve notes. Please try again." 
    });
  }
};

// @desc    Get single note
// @route   GET /api/v1/notes/:id
// @access  Public
exports.getNote = asyncHandler(async (req, res, next) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return next(new ErrorResponse(`Note not found with id of ${req.params.id}`, 404));
  }

  // Increment view count
  note.viewCount = (note.viewCount || 0) + 1;
  await note.save();

  res.status(200).json({
    success: true,
    data: note
  });
});

// @desc    Create new note
// @route   POST /api/v1/notes
// @access  Private
exports.createNote = asyncHandler(async (req, res) => {
  req.body.user = req.user.id;

  // Check if the note already exists for this user
  const existingNote = await Note.findOne({
    user: req.user.id,
    title: req.body.title
  });

  if (existingNote) {
    return res.status(400).json({
      success: false,
      message: 'You already have a note with this title'
    });
  }

  const note = await Note.create(req.body);

  // Update user XP for creating a note
  await User.findByIdAndUpdate(
    req.user.id,
    { $inc: { xp: 50 } },
    { new: true }
  );

  res.status(201).json({
    success: true,
    data: note
  });
});

// @desc    Update note
// @route   PUT /api/v1/notes/:id
// @access  Private
exports.updateNote = asyncHandler(async (req, res) => {
  let note = await Note.findById(req.params.id);

  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found'
    });
  }

  // Make sure user is the note owner
  if (note.user.toString() !== req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to update this note'
    });
  }

  note = await Note.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: note
  });
});

// @desc    Delete note
// @route   DELETE /api/v1/notes/:id
// @access  Private
exports.deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found'
    });
  }

  // Make sure user is the note owner
  if (note.user.toString() !== req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to delete this note'
    });
  }

  await note.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get notes uploaded by user
// @route   GET /api/v1/notes/user/:userId
// @access  Public
exports.getUserNotes = asyncHandler(async (req, res, next) => {
  const notes = await Note.find({ 
    user: req.params.userId,
    isPublic: true 
  });

  res.status(200).json({
    success: true,
    count: notes.length,
    data: notes
  });
});

// @desc    Get my notes
// @route   GET /api/v1/notes/my-notes
// @access  Private
exports.getMyNotes = asyncHandler(async (req, res, next) => {
  const notes = await Note.find({ user: req.user.id });

  res.status(200).json({
    success: true,
    count: notes.length,
    data: notes
  });
});

// @desc    Add rating to note
// @route   POST /api/v1/notes/:id/ratings
// @access  Private (would require auth)
exports.addRating = asyncHandler(async (req, res, next) => {
  const { rating } = req.body;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return next(new ErrorResponse('Please provide a rating between 1 and 5', 400));
  }

  const note = await Note.findById(req.params.id);

  if (!note) {
    return next(new ErrorResponse(`Note not found with id of ${req.params.id}`, 404));
  }

  // Add rating
  // In a real auth system, you'd use the user's ID from req.user
  const userId = '60f1a5c5c9e4b42d8c9e4b42'; // Dummy user ID
  
  // Check if user already rated
  const existingRatingIndex = note.ratings.findIndex(
    r => r.user && r.user.toString() === userId
  );

  if (existingRatingIndex >= 0) {
    // Update existing rating
    note.ratings[existingRatingIndex].value = rating;
  } else {
    // Add new rating
    note.ratings.push({
      value: rating,
      user: userId
    });
  }

  // Calculate average rating
  if (note.ratings.length > 0) {
    const sum = note.ratings.reduce((total, item) => total + item.value, 0);
    note.averageRating = sum / note.ratings.length;
  }

  await note.save();

  res.status(200).json({
    success: true,
    data: note
  });
});

// @desc    Increment download count
// @route   PUT /api/v1/notes/:id/download
// @access  Private
exports.downloadNote = asyncHandler(async (req, res, next) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return next(new ErrorResponse(`Note not found with id of ${req.params.id}`, 404));
  }

  // Increment download count
  note.downloadCount += 1;
  await note.save();

  // Add activity
  req.user.addActivity('download', `Downloaded note: ${note.title}`, 1);
  req.user.xp += 1;
  await req.user.save();

  // Add XP to note creator (but not if self-download)
  if (note.user.toString() !== req.user.id) {
    const noteOwner = await User.findById(note.user);
    noteOwner.xp += 3;
    noteOwner.addActivity('earn_xp', 'Someone downloaded your note', 3);
    await noteOwner.save();
  }

  res.status(200).json({
    success: true,
    data: note
  });
});

// @desc    Get top rated notes
// @route   GET /api/v1/notes/top-rated
// @access  Public
exports.getTopRatedNotes = asyncHandler(async (req, res, next) => {
  const notes = await Note.find({ 
    isPublic: true,
    averageRating: { $gt: 0 }
  })
  .sort({ averageRating: -1 })
  .limit(10)
  .populate({
    path: 'user',
    select: 'name username profileImage'
  });

  res.status(200).json({
    success: true,
    count: notes.length,
    data: notes
  });
});

// @desc    Get notes by subject
// @route   GET /api/v1/notes/subject/:subject
// @access  Public
exports.getNotesBySubject = asyncHandler(async (req, res, next) => {
  const notes = await Note.find({ 
    subject: req.params.subject,
    isPublic: true 
  })
  .sort({ createdAt: -1 })
  .populate({
    path: 'user',
    select: 'name username profileImage'
  });

  res.status(200).json({
    success: true,
    count: notes.length,
    data: notes
  });
});

// @desc    Add flashcards to note
// @route   POST /api/v1/notes/:id/flashcards
// @access  Private
exports.addFlashcards = asyncHandler(async (req, res, next) => {
  const { flashcards } = req.body;

  if (!flashcards || !Array.isArray(flashcards)) {
    return next(new ErrorResponse('Please provide an array of flashcards', 400));
  }

  const note = await Note.findById(req.params.id);

  if (!note) {
    return next(new ErrorResponse(`Note not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is note owner
  if (note.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to add flashcards to this note`, 401));
  }

  // Add new flashcards
  note.flashcards = [...note.flashcards, ...flashcards];
  
  await note.save();

  // Add XP
  const xpEarned = Math.min(flashcards.length, 10); // Cap at 10 XP
  req.user.xp += xpEarned;
  req.user.addActivity('earn_xp', `Created ${flashcards.length} flashcards`, xpEarned);
  await req.user.save();

  res.status(200).json({
    success: true,
    data: note
  });
});

// @desc    Search notes
// @route   GET /api/v1/notes/search
// @access  Public
exports.searchNotes = asyncHandler(async (req, res, next) => {
  const { q } = req.query;
  
  if (!q) {
    return next(new ErrorResponse('Please provide a search query', 400));
  }

  const notes = await Note.find({ 
    $text: { $search: q },
    isPublic: true 
  })
  .sort({ score: { $meta: 'textScore' } })
  .populate({
    path: 'user',
    select: 'name username profileImage'
  });

  res.status(200).json({
    success: true,
    count: notes.length,
    data: notes
  });
});

// @desc    Get filtered notes
// @route   GET /api/v1/notes/filter
// @access  Public
exports.getNotesByFilters = async (req, res) => {
  try {
    // Create filter object for MongoDB query
    const filter = {};
    
    // Add query parameters to filter if they exist
    if (req.query.grade) filter.grade = req.query.grade;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.semester) filter.semester = req.query.semester;
    if (req.query.quarter) filter.quarter = req.query.quarter;
    
    // For topic, use regex for partial matching
    if (req.query.topic) {
      filter.topic = new RegExp(req.query.topic, 'i');
    }
    
    console.log("[Backend] Filtering notes with query:", req.query);
    console.log("[Backend] Using filter:", filter);
    
    // Find notes matching filter criteria
    const notes = await Note.find(filter).populate({
      path: 'user',
      select: 'name username profileImage'
    });
    
    console.log("[Backend] Found", notes.length, "notes matching criteria");
    
    // Return notes as JSON array
    return res.status(200).json({
      success: true, 
      count: notes.length,
      data: notes
    });
  } catch (error) {
    console.error("MongoDB Filter Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to retrieve notes. Please try again." 
    });
  }
};

// @desc    Upload note file to Cloudinary
// @route   POST /api/v1/notes/upload
// @access  Private
exports.uploadNoteFile = asyncHandler(async (req, res) => {
  // This function would handle direct file uploads
  // In the current implementation, we're using Cloudinary client-side
  res.status(501).json({
    success: false,
    message: 'This endpoint is not implemented. Use client-side Cloudinary upload instead.'
  });
});

// @desc    Rate a note
// @route   POST /api/v1/notes/:id/ratings
// @access  Private
exports.rateNote = asyncHandler(async (req, res) => {
  const { rating } = req.body;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a rating between 1 and 5'
    });
  }

  const note = await Note.findById(req.params.id);

  if (!note) {
    return res.status(404).json({
      success: false,
      message: `Note not found with id of ${req.params.id}`
    });
  }

  // Check if user already rated
  const existingRatingIndex = note.ratings.findIndex(
    r => r.user && r.user.toString() === req.user.id
  );

  if (existingRatingIndex >= 0) {
    // Update existing rating
    note.ratings[existingRatingIndex].value = rating;
  } else {
    // Add new rating
    note.ratings.push({
      value: rating,
      user: req.user.id
    });
  }

  // Calculate average rating
  if (note.ratings.length > 0) {
    const sum = note.ratings.reduce((total, item) => total + item.value, 0);
    note.averageRating = sum / note.ratings.length;
  }

  await note.save();

  // Add XP for rating
  await User.findByIdAndUpdate(
    req.user.id,
    { $inc: { xp: 5 } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: note
  });
});

// @desc    Increment download count
// @route   PUT /api/v1/notes/:id/download
// @access  Private
exports.incrementDownloads = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return res.status(404).json({
      success: false,
      message: `Note not found with id of ${req.params.id}`
    });
  }

  // Increment download count
  note.downloadCount += 1;
  await note.save();

  // Add XP for downloading
  await User.findByIdAndUpdate(
    req.user.id,
    { $inc: { xp: 1 } },
    { new: true }
  );

  // Add XP to note creator (but not if self-download)
  if (note.user && note.user.toString() !== req.user.id) {
    await User.findByIdAndUpdate(
      note.user,
      { $inc: { xp: 3 } },
      { new: true }
    );
  }

  res.status(200).json({
    success: true,
    data: note
  });
});

// @desc    Create flashcards for a note
// @route   POST /api/v1/notes/:id/flashcards
// @access  Private
exports.createFlashcard = asyncHandler(async (req, res) => {
  const { flashcards } = req.body;

  if (!flashcards || !Array.isArray(flashcards)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of flashcards'
    });
  }

  const note = await Note.findById(req.params.id);

  if (!note) {
    return res.status(404).json({
      success: false,
      message: `Note not found with id of ${req.params.id}`
    });
  }

  // Make sure user is note owner
  if (note.user.toString() !== req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to add flashcards to this note'
    });
  }

  // Add new flashcards
  note.flashcards = [...note.flashcards, ...flashcards];
  
  await note.save();

  // Add XP for creating flashcards (capped at 10 XP)
  const xpEarned = Math.min(flashcards.length, 10);
  
  await User.findByIdAndUpdate(
    req.user.id,
    { $inc: { xp: xpEarned } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: note
  });
}); 