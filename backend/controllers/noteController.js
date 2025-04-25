const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Note = require('../models/Note');
const User = require('../models/User');

// @desc    Get all notes
// @route   GET /api/v1/notes
// @access  Public
exports.getNotes = asyncHandler(async (req, res, next) => {
  // Copy query object
  const queryObj = { ...req.query };

  // Fields to exclude from filtering
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete queryObj[field]);

  // Create filter object
  const filter = {};
  
  // Add query parameters to filter
  if (queryObj.grade) filter.grade = queryObj.grade;
  if (queryObj.subject) filter.subject = queryObj.subject;
  if (queryObj.semester) filter.semester = queryObj.semester;
  if (queryObj.quarter) filter.quarter = queryObj.quarter;
  if (queryObj.topic) {
    // For topic, we use a partial match
    filter.topic = new RegExp(queryObj.topic, 'i');
  }
  
  // Handle text search
  if (queryObj.search) {
    filter.$text = { $search: queryObj.search };
  }

  // Get total count for pagination
  const total = await Note.countDocuments(filter);

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Query with pagination
  const notes = await Note.find(filter)
    .skip(startIndex)
    .limit(limit)
    .sort(req.query.sort || '-createdAt');

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: notes.length,
    pagination,
    total,
    data: notes
  });
});

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
// @access  Public (would typically be Private with auth)
exports.createNote = asyncHandler(async (req, res, next) => {
  const { 
    title, 
    description, 
    subject, 
    grade, 
    semester, 
    quarter, 
    topic, 
    fileUrl, 
    fileType,
    publicId,
    assetId,
    tags
  } = req.body;

  // Validate required fields
  if (!title || !subject || !grade || !fileUrl) {
    return next(new ErrorResponse('Please provide all required fields', 400));
  }

  // Create note with all metadata
  const note = await Note.create({
    title,
    description,
    subject,
    grade,
    semester,
    quarter,
    topic,
    fileUrl,
    fileType: fileType || 'unknown',
    publicId,
    assetId,
    tags,
    // If authenticated, would add: user: req.user.id
  });

  res.status(201).json(note);
});

// @desc    Update note
// @route   PUT /api/v1/notes/:id
// @access  Private (would require auth)
exports.updateNote = asyncHandler(async (req, res, next) => {
  let note = await Note.findById(req.params.id);

  if (!note) {
    return next(new ErrorResponse(`Note not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the note (if authenticated)
  // if (note.user.toString() !== req.user.id && req.user.role !== 'admin') {
  //   return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this note`, 401));
  // }

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
// @access  Private (would require auth)
exports.deleteNote = asyncHandler(async (req, res, next) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return next(new ErrorResponse(`Note not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the note (if authenticated)
  // if (note.user.toString() !== req.user.id && req.user.role !== 'admin') {
  //   return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this note`, 401));
  // }

  await note.remove();

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