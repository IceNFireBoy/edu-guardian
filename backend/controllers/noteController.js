const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Note = require('../models/Note');
const User = require('../models/User');

// @desc    Get all notes
// @route   GET /api/v1/notes
// @access  Public
exports.getNotes = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single note
// @route   GET /api/v1/notes/:id
// @access  Public
exports.getNote = asyncHandler(async (req, res, next) => {
  const note = await Note.findById(req.params.id).populate({
    path: 'user',
    select: 'name username profileImage'
  });

  if (!note) {
    return next(new ErrorResponse(`Note not found with id of ${req.params.id}`, 404));
  }

  // Increment view count
  note.viewCount += 1;
  await note.save();

  res.status(200).json({
    success: true,
    data: note
  });
});

// @desc    Create new note
// @route   POST /api/v1/notes
// @access  Private
exports.createNote = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Create note
  const note = await Note.create(req.body);

  // Update user's activity
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { xp: 10 }
  });

  // Add activity record
  req.user.addActivity('upload', `Uploaded note: ${note.title}`, 10);
  await req.user.save();

  res.status(201).json({
    success: true,
    data: note
  });
});

// @desc    Update note
// @route   PUT /api/v1/notes/:id
// @access  Private
exports.updateNote = asyncHandler(async (req, res, next) => {
  let note = await Note.findById(req.params.id);

  if (!note) {
    return next(new ErrorResponse(`Note not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is note owner
  if (note.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this note`, 401));
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
exports.deleteNote = asyncHandler(async (req, res, next) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return next(new ErrorResponse(`Note not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is note owner
  if (note.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this note`, 401));
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

// @desc    Rate note
// @route   POST /api/v1/notes/:id/ratings
// @access  Private
exports.addRating = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return next(new ErrorResponse('Please provide a rating between 1 and 5', 400));
  }

  const note = await Note.findById(req.params.id);

  if (!note) {
    return next(new ErrorResponse(`Note not found with id of ${req.params.id}`, 404));
  }

  // Check if user already rated this note
  const existingRatingIndex = note.ratings.findIndex(
    r => r.user.toString() === req.user.id
  );

  if (existingRatingIndex !== -1) {
    // Update existing rating
    note.ratings[existingRatingIndex].rating = rating;
    note.ratings[existingRatingIndex].comment = comment || '';
  } else {
    // Add new rating
    note.ratings.push({
      user: req.user.id,
      rating,
      comment: comment || ''
    });

    // Add XP to note creator (but not if self-rating)
    if (note.user.toString() !== req.user.id) {
      const noteOwner = await User.findById(note.user);
      noteOwner.xp += 2;
      noteOwner.addActivity('earn_xp', 'Someone rated your note', 2);
      await noteOwner.save();
    }

    // Add activity for the rater
    req.user.addActivity('rate', `Rated note: ${note.title}`, 1);
    req.user.xp += 1;
    await req.user.save();
  }

  // Calculate average rating
  note.getAverageRating();
  
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