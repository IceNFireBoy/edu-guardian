import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import asyncHandler from '../middleware/async';
import NoteService, { NoteQueryFilters } from '../services/NoteService';
import ErrorResponse from '../utils/errorResponse';
import { CustomRequest } from '../middleware/auth'; // For req.user if needed
import { INote } from '../models/Note'; // For types
import mongoose from 'mongoose'; 

// Create a singleton instance of the NoteService
const noteService = new NoteService();

// Export as default so it can be imported correctly
export default class NoteController {
  // @desc    Get all notes (with filtering and pagination)
// @route   GET /api/v1/notes
// @access  Public
  public getNotes = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    const { grade, subject, semester, quarter, topic, page, limit, sortBy, sortOrder } = req.query;
    const filters: NoteQueryFilters = {};
    if (grade) filters.grade = grade as string;
    if (subject) filters.subject = subject as string;
    if (semester) filters.semester = semester as string;
    if (quarter) filters.quarter = quarter as string;
    if (topic) {
      // Escape special RegExp characters to prevent ReDoS vulnerabilities
      const escapedTopic = (topic as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filters.topic = { $regex: new RegExp(escapedTopic, "i") } as any;
    }
    
    const paginationOptions = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as string | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined
    };

    try {
      const result = await noteService.getAllNotes(filters, paginationOptions);
      res.status(200).json({
      success: true,
        count: result.count,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        data: result.notes
    });
  } catch (error) {
      next(error);
    }
  });

  // @desc    Get single note by ID
// @route   GET /api/v1/notes/:id
// @access  Public
  public getNoteById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }
    const noteId = req.params.id;
    try {
      const note = await noteService.getNoteById(noteId);
  if (!note) {
        return next(new ErrorResponse(`Note not found with id of ${noteId}`, 404));
      }
      res.status(200).json({ success: true, data: note });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Create a new note
// @route   POST /api/v1/notes
  // @access  Protected (User needs to be logged in)
  public createNote = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    if (!req.user) {
        return next(new ErrorResponse('User not authenticated to create a note', 401));
    }
    const userId = req.user.id;

    const { 
      title, 
      subject, 
      grade, 
      semester, 
      quarter, 
      topic, 
      fileUrl,
        fileType,
        fileSize,
        description,
        tags,
        isPublic
    } = req.body;
    
    const noteData: Partial<INote> = {
      title,
      subject,
      grade,
      semester,
      quarter,
      topic,
      fileUrl,
        fileType,
        fileSize,
        description,
        tags,
    };
    
    if (typeof isPublic === 'boolean') {
        noteData.isPublic = isPublic;
    } 

    try {
      const note = await noteService.createNote(noteData, userId);
      res.status(201).json({
      success: true,
      data: note
    });
  } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        const messages = Object.values(error.errors).map(e => e.message);
        return next(new ErrorResponse(`Validation Error from Mongoose: ${messages.join(', ')}`, 400));
      }
      next(error);
    }
  });

   // @desc    Update a note by ID
// @route   PUT /api/v1/notes/:id
  // @access  Protected (Owner of the note)
  public updateNoteById = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    if (!req.user) {
        return next(new ErrorResponse('User not authenticated to update a note', 401));
    }
    const userId = req.user.id;
    const noteId = req.params.id;

    const {
        title,
        description,
        subject,
        grade,
        semester,
        quarter,
        topic,
        tags,
        isPublic,
        fileUrl, 
        fileType,
        fileSize,
        publicId,
        assetId
    } = req.body;

    const noteData: Partial<INote> = {};
    if (title !== undefined) noteData.title = title;
    if (description !== undefined) noteData.description = description;
    if (subject !== undefined) noteData.subject = subject;
    if (grade !== undefined) noteData.grade = grade;
    if (semester !== undefined) noteData.semester = semester;
    if (quarter !== undefined) noteData.quarter = quarter;
    if (topic !== undefined) noteData.topic = topic;
    if (tags !== undefined) noteData.tags = tags;
    if (isPublic !== undefined) noteData.isPublic = isPublic;
    if (fileUrl !== undefined) noteData.fileUrl = fileUrl;
    if (fileType !== undefined) noteData.fileType = fileType;
    if (fileSize !== undefined) noteData.fileSize = fileSize;
    if (publicId !== undefined) noteData.publicId = publicId;
    if (assetId !== undefined) noteData.assetId = assetId;

    if (Object.keys(noteData).length === 0) {
        return next(new ErrorResponse('No data provided for update', 400));
    }

    try {
      const updatedNote = await noteService.updateNote(noteId, noteData);
      if (!updatedNote) {
        return next(new ErrorResponse(`Note not found with id of ${noteId}`, 404));
      }
      res.status(200).json({ success: true, data: updatedNote });
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            const messages = Object.values(error.errors).map(e => e.message);
            return next(new ErrorResponse(`Validation Error from Mongoose: ${messages.join(', ')}`, 400));
        }
      next(error);
    }
  });
  // @desc    Delete a note by ID
// @route   DELETE /api/v1/notes/:id
  // @access  Protected (Owner of the note)
  public deleteNoteById = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    if (!req.user) {
        return next(new ErrorResponse('User not authenticated to delete a note', 401));
    }
    const userId = req.user.id;
    const noteId = req.params.id;

    try {
      const deletedNote = await noteService.deleteNote(noteId);
      if (!deletedNote) {
        return next(new ErrorResponse(`Note not found with id of ${noteId}`, 404));
      }
      res.status(200).json({ success: true, data: deletedNote });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Get notes for a user
  // @route   GET /api/v1/notes/user/:userId
  // @access  Protected (User needs to be logged in)
  public getUserNotes = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    if (!req.user) {
        return next(new ErrorResponse('User not authenticated to get user notes', 401));
    }
    const userId = req.params.userId;

    try {
      const notes = await noteService.getUserNotes(userId);
      res.status(200).json({ success: true, data: notes });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Get notes for the authenticated user
  // @route   GET /api/v1/notes/my
  // @access  Protected (User needs to be logged in)
  public getMyNotes = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    if (!req.user) {
        return next(new ErrorResponse('User not authenticated to get my notes', 401));
    }
    const userId = req.user.id;

    try {
      const notes = await noteService.getMyNotes(userId);
      res.status(200).json({ success: true, data: notes });
    } catch (error) {
      next(error);
    }
});

// @desc    Get top rated notes
  // @route   GET /api/v1/notes/top
// @access  Public
  public getTopRatedNotes = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    try {
      const notes = await noteService.getTopRatedNotes();
      res.status(200).json({ success: true, data: notes });
    } catch (error) {
      next(error);
    }
});

// @desc    Get notes by subject
// @route   GET /api/v1/notes/subject/:subject
// @access  Public
  public getNotesBySubject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    const subject = req.params.subject;

    try {
      const notes = await noteService.getNotesBySubject(subject);
      res.status(200).json({ success: true, data: notes });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Add flashcards to a note
// @route   POST /api/v1/notes/:id/flashcards
  // @access  Protected (User needs to be logged in)
  public addFlashcardsToNote = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    if (!req.user) {
        return next(new ErrorResponse('User not authenticated to add flashcards to a note', 401));
    }
    const userId = req.user.id;
    const noteId = req.params.id;

    const {
        flashcards
    } = req.body;

    try {
      const updatedNote = await noteService.addFlashcardsToNote(noteId, userId, flashcards);
      if (!updatedNote) {
        return next(new ErrorResponse(`Note not found with id of ${noteId}`, 404));
      }
      res.status(200).json({ success: true, data: updatedNote });
    } catch (error) {
      next(error);
    }
});

// @desc    Search notes
// @route   GET /api/v1/notes/search
// @access  Public
  public searchNotes = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    const { query } = req.query;

    try {
      const notes = await noteService.searchNotes(query as string);
      res.status(200).json({ success: true, data: notes });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Upload a note file
  // @route   POST /api/v1/notes/:id/file
  // @access  Protected (User needs to be logged in)
  public uploadNoteFile = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    if (!req.user) {
        return next(new ErrorResponse('User not authenticated to upload a note file', 401));
    }
    const userId = req.user.id;
    const noteId = req.params.id;

    const file = req.file;

    if (!file) {
      return next(new ErrorResponse('No file uploaded', 400));
    }

    try {
      const updatedNote = await noteService.uploadNoteFile(noteId, userId, file);
      if (!updatedNote) {
        return next(new ErrorResponse(`Note not found with id of ${noteId} or upload failed`, 404));
      }
      res.status(200).json({ success: true, data: updatedNote });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Get notes by filters
  // @route   GET /api/v1/notes/filters
  // @access  Public
  public getNotesByFilters = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    const { filters } = req.query;

    try {
      const notes = await noteService.getNotesByFilters(filters as string);
      res.status(200).json({ success: true, data: notes });
  } catch (error) {
      next(error);
    }
  });

  // @desc    Rate a note
  // @route   POST /api/v1/notes/:id/rate
  // @access  Protected (User needs to be logged in)
  public rateNote = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    if (!req.user) {
        return next(new ErrorResponse('User not authenticated to rate a note', 401));
    }
    const userId = req.user.id;
    const noteId = req.params.id;

    const { rating } = req.body;

    try {
      const updatedNote = await noteService.rateNote(noteId, userId, rating);
      if (!updatedNote) {
        return next(new ErrorResponse(`Note not found with id of ${noteId}`, 404));
      }
      res.status(200).json({ success: true, data: updatedNote });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Increment downloads for a note
  // @route   POST /api/v1/notes/:id/downloads
  // @access  Protected (User needs to be logged in)
  public incrementDownloads = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    if (!req.user) {
        return next(new ErrorResponse('User not authenticated to increment downloads for a note', 401));
    }
    const userId = req.user.id;
    const noteId = req.params.id;

    try {
      const updatedNote = await noteService.incrementDownloads(noteId, userId);
      if (!updatedNote) {
        return next(new ErrorResponse(`Note not found with id of ${noteId}`, 404));
      }
      res.status(200).json({ success: true, data: updatedNote });
  } catch (error) {
      next(error);
    }
  });

  // @desc    Create a flashcard for a note
  // @route   POST /api/v1/notes/:id/flashcards
  // @access  Protected (User needs to be logged in)
  public createFlashcardForNote = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    if (!req.user) {
        return next(new ErrorResponse('User not authenticated to create a flashcard for a note', 401));
    }
  const userId = req.user.id;
    const noteId = req.params.id;

    const {
        front,
        back
    } = req.body;

    try {
      const flashcard = await noteService.createFlashcardForNote(noteId, userId, front, back);
      if (!flashcard) {
        return next(new ErrorResponse(`Note not found with id of ${noteId}`, 404));
      }
      res.status(201).json({ success: true, data: flashcard });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Generate AI summary for a note
  // @route   POST /api/v1/notes/:id/summary
  // @access  Protected (User needs to be logged in)
  public generateAISummaryForNote = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    if (!req.user) {
        return next(new ErrorResponse('User not authenticated to generate AI summary for a note', 401));
    }
    const userId = req.user.id;
    const noteId = req.params.id;

    try {
      const summary = await noteService.generateAISummaryForNote(noteId, userId);
      if (!summary) {
        return next(new ErrorResponse(`Note not found with id of ${noteId}`, 404));
      }
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Generate AI flashcards for a note
  // @route   POST /api/v1/notes/:id/flashcards
  // @access  Protected (User needs to be logged in)
  public generateAIFlashcardsForNote = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    if (!req.user) {
        return next(new ErrorResponse('User not authenticated to generate AI flashcards for a note', 401));
    }
    const userId = req.user.id;
    const noteId = req.params.id;

    try {
      const flashcards = await noteService.generateAIFlashcardsForNote(noteId, userId);
      if (!flashcards) {
    return next(new ErrorResponse(`Note not found with id of ${noteId}`, 404));
  }
      res.status(200).json({ success: true, data: flashcards });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Save AI Generated Flashcards to a Note
  // @route   POST /api/v1/notes/:noteId/save-ai-flashcards
  // @access  Protected (Owner of the note)
  public saveAIGeneratedFlashcards = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(`Validation Error: ${errors.array().map(e => e.msg).join(', ')}`, 400));
    }

    if (!req.user) {
      return next(new ErrorResponse('User not authenticated to save flashcards', 401));
    }
    const userId = req.user.id;
    const noteId = req.params.id;
    const { flashcards } = req.body;

    if (!flashcards || !Array.isArray(flashcards)) {
      return next(new ErrorResponse('Flashcards data is missing or not an array', 400));
    }

    // Basic validation for each flashcard object can be done here or relied upon by the service
    // For brevity, we assume the service handles detailed validation of flashcard structure.
    if (flashcards.some(fc => !fc.question || !fc.answer)) {
        return next(new ErrorResponse('Each flashcard must have a question and answer.', 400));
    }

    try {
      const updatedNote = await noteService.saveGeneratedFlashcardsToNote(noteId, userId, flashcards);
      if (!updatedNote) {
        // This case should ideally be covered by service throwing ErrorResponse for not found
        return next(new ErrorResponse(`Note not found with id of ${noteId} or save operation failed`, 404));
      }
      res.status(200).json({ success: true, data: { flashcards: updatedNote.flashcards } });
    } catch (error) {
      next(error);
    }
  });
} 