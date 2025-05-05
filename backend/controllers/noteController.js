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
    if (req.query.grade) {
      filter.grade = { $regex: new RegExp(req.query.grade, "i") };
    }
    if (req.query.subject) {
      filter.subject = { $regex: new RegExp(req.query.subject, "i") };
    }
    if (req.query.semester) {
      filter.semester = req.query.semester;
    }
    if (req.query.quarter) {
      filter.quarter = req.query.quarter;
    }
    if (req.query.topic) {
      filter.topic = { $regex: new RegExp(req.query.topic, "i") };
    }
    
    console.log("[Backend] getNotes: Query parameters:", req.query);
    console.log("[Backend] getNotes: MongoDB filter:", filter);
    
    // Find notes matching filter criteria
    const notes = await Note.find(filter)
      .select('-__v')
      .lean()
      .exec();
    
    console.log("[Backend] getNotes: Found", notes.length, "notes");
    console.log("[Backend] getNotes: Sample note:", notes[0] ? {
      _id: notes[0]._id,
      title: notes[0].title,
      subject: notes[0].subject
    } : "No notes found");
    
    // Return notes in standard format
    return res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error) {
    console.error("[Backend] getNotes Error:", error);
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
// @access  Public
exports.createNote = asyncHandler(async (req, res) => {
  try {
    const { 
      title, 
      subject, 
      grade, 
      semester, 
      quarter, 
      topic, 
      fileUrl 
    } = req.body;
    
    console.log("[Backend] Received note creation request:", req.body);
    
    // Validate required fields
    if (!title || !subject || !grade || !fileUrl) {
      console.log("[Backend] Validation failed - missing required fields");
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields. Please provide title, subject, grade, and fileUrl." 
      });
    }
    
    // Create note with metadata - no user association required
    const note = await Note.create({
      title,
      subject,
      grade,
      semester,
      quarter,
      topic,
      fileUrl,
      // Additional fields if needed
      fileType: req.body.fileType || 'unknown',
      fileSize: req.body.fileSize || 0,
      tags: req.body.tags || [],
      // Set a dummy user ID or make it optional in the schema
      user: "6507b7b1a2b49cb4d68df781" // Dummy user ID
    });
    
    console.log("[Backend] Note successfully saved in MongoDB:", note._id);
    
    // Return success response with created note
    return res.status(201).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error("[Backend] Error creating note:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to save note. Please try again." 
    });
  }
});

// @desc    Update note
// @route   PUT /api/v1/notes/:id
// @access  Public
exports.updateNote = asyncHandler(async (req, res) => {
  let note = await Note.findById(req.params.id);

  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found'
    });
  }

  // No authentication check - allow anyone to update notes
  note = await Note.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  console.log("[Backend] Note updated successfully:", note._id);

  res.status(200).json({
    success: true,
    data: note
  });
});

// @desc    Delete note
// @route   DELETE /api/v1/notes/:id
// @access  Public
exports.deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found'
    });
  }

  // No authentication check - allow anyone to delete notes
  await note.deleteOne();
  
  console.log("[Backend] Note deleted successfully:", req.params.id);

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
// @access  Public
exports.getMyNotes = asyncHandler(async (req, res, next) => {
  // Without authentication, return all notes since we can't identify "my" notes
  const notes = await Note.find();
  
  console.log("[Backend] Returning all notes as 'my notes' since auth is disabled");

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
// @access  Public
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
  
  console.log("[Backend] Note download count incremented for:", req.params.id);

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
    if (req.query.grade) {
      filter.grade = { $regex: new RegExp(req.query.grade, "i") };
    }
    if (req.query.subject) {
      filter.subject = { $regex: new RegExp(req.query.subject, "i") };
    }
    if (req.query.semester) {
      filter.semester = req.query.semester;
    }
    if (req.query.quarter) {
      filter.quarter = req.query.quarter;
    }
    if (req.query.topic) {
      filter.topic = { $regex: new RegExp(req.query.topic, "i") };
    }
    
    console.log("[Backend] getNotesByFilters: Query parameters:", req.query);
    console.log("[Backend] getNotesByFilters: MongoDB filter:", filter);
    
    // Find notes matching filter criteria
    const notes = await Note.find(filter)
      .select('-__v')
      .lean()
      .exec();
    
    console.log("[Backend] getNotesByFilters: Found", notes.length, "notes");
    
    // Return notes in standard format
    return res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error) {
    console.error("[Backend] getNotesByFilters Error:", error);
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
// @access  Public
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

  // Use a dummy user ID since there's no authentication
  const dummyUserId = "6507b7b1a2b49cb4d68df781";
  
  // Check if dummy user already rated
  const existingRatingIndex = note.ratings.findIndex(
    r => r.user && r.user.toString() === dummyUserId
  );

  if (existingRatingIndex >= 0) {
    // Update existing rating
    note.ratings[existingRatingIndex].value = rating;
  } else {
    // Add new rating
    note.ratings.push({
      value: rating,
      user: dummyUserId
    });
  }

  // Calculate average rating
  if (note.ratings.length > 0) {
    const sum = note.ratings.reduce((total, item) => total + item.value, 0);
    note.averageRating = sum / note.ratings.length;
  }

  await note.save();
  
  console.log("[Backend] Note rated successfully:", req.params.id, "with rating:", rating);

  res.status(200).json({
    success: true,
    data: note
  });
});

// @desc    Create flashcards for a note
// @route   POST /api/v1/notes/:id/flashcards
// @access  Public
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

  // No authentication check - allow anyone to add flashcards
  
  // Add new flashcards
  note.flashcards = [...note.flashcards, ...flashcards];
  
  await note.save();
  
  console.log("[Backend] Flashcards added to note:", req.params.id, "Count:", flashcards.length);

  res.status(200).json({
    success: true,
    data: note
  });
}); 