import { Response, NextFunction } from 'express';
import asyncHandler from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';
import { CustomRequest } from '../middleware/auth';
import Note, { INote } from '../models/Note';
import AIService from '../services/AIService';
import SrsService from '../services/SrsService';
import { extractTextFromFile } from '../utils/extractTextFromFile';
import { consumeAiQuota } from '../utils/aiUsage';
import { AI_MAX_SOURCE_CHARS, AI_RESULT_TTL } from '../config/aiConfig';
import cache from '../utils/cache';

/**
 * Endpoints for AI-powered study features. All are authenticated and enforce a
 * per-user daily quota (429 on exceed). Text is derived from the note's uploaded
 * file, with a title/description fallback so a feature still works if extraction
 * fails.
 */
export default class AIController {
  private static async noteSourceText(note: INote): Promise<string> {
    let text = '';
    try {
      text = await extractTextFromFile(note.fileUrl);
    } catch {
      text = '';
    }
    if (!text || text.trim().length < 20) {
      text = `${note.title}. ${note.description ?? ''} Topic: ${note.topic}. Subject: ${note.subject}.`;
    }
    return text.slice(0, AI_MAX_SOURCE_CHARS);
  }

  private static userContext(req: CustomRequest): string {
    const u = req.user!;
    return (
      `Level ${u.level}, ${u.xp} XP, current streak ${u.streak?.current ?? 0} days, ` +
      `${u.studiedNotes?.length ?? 0} notes studied.`
    );
  }

  // @route POST /api/v1/ai/notes/:id/summary   body: { regenerate? }
  static summarizeNote = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const note = await Note.findById(req.params.id);
    if (!note) return next(new ErrorResponse('Note not found', 404));

    // Serve the stored summary for free unless the caller forces a regenerate —
    // most repeat views cost zero provider calls (key protection under load).
    if (note.aiSummary && !req.body?.regenerate) {
      res.status(200).json({ success: true, data: { summary: note.aiSummary, cached: true } });
      return;
    }

    await consumeAiQuota(req.user!, 'summary');
    const source = await AIController.noteSourceText(note);
    const summary = await AIService.summarize(source);

    note.aiSummary = summary;
    await note.save();

    res.status(200).json({ success: true, data: { summary } });
  });

  // @route POST /api/v1/ai/notes/:id/flashcards   body: { count?, save?, regenerate? }
  static generateFlashcards = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const note = await Note.findById(req.params.id);
    if (!note) return next(new ErrorResponse('Note not found', 404));

    const count = Number(req.body?.count) || 8;
    const cacheKey = `ai:flashcards:${note._id}:${count}:${note.updatedAt?.getTime?.() ?? ''}`;

    // Cache hit -> serve for free (no quota, no provider call).
    if (!req.body?.regenerate) {
      const cached = await cache.get<any[]>(cacheKey);
      if (cached) {
        res.status(200).json({ success: true, count: cached.length, data: { flashcards: cached }, cached: true });
        return;
      }
    }

    await consumeAiQuota(req.user!, 'flashcard');
    const source = await AIController.noteSourceText(note);
    const flashcards = await AIService.generateFlashcards(source, count);
    await cache.set(cacheKey, flashcards, AI_RESULT_TTL);

    if (req.body?.save) {
      note.flashcards.push(...(flashcards as any));
      await note.save();
    }

    res.status(200).json({ success: true, count: flashcards.length, data: { flashcards } });
  });

  // @route POST /api/v1/ai/notes/:id/quiz   body: { count?, regenerate? }
  static generateQuiz = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const note = await Note.findById(req.params.id);
    if (!note) return next(new ErrorResponse('Note not found', 404));

    const count = Number(req.body?.count) || 5;
    const cacheKey = `ai:quiz:${note._id}:${count}:${note.updatedAt?.getTime?.() ?? ''}`;

    if (!req.body?.regenerate) {
      const cached = await cache.get<any[]>(cacheKey);
      if (cached) {
        res.status(200).json({ success: true, count: cached.length, data: { questions: cached }, cached: true });
        return;
      }
    }

    await consumeAiQuota(req.user!, 'quiz');
    const source = await AIController.noteSourceText(note);
    const questions = await AIService.generateQuiz(source, count);
    await cache.set(cacheKey, questions, AI_RESULT_TTL);

    res.status(200).json({ success: true, count: questions.length, data: { questions } });
  });

  // @route POST /api/v1/ai/chat   body: { message }
  static chat = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const message = (req.body?.message ?? '').toString().trim();
    if (!message) return next(new ErrorResponse('A message is required', 400));

    await consumeAiQuota(req.user!, 'chat');
    const reply = await AIService.chat(message, AIController.userContext(req));

    res.status(200).json({ success: true, data: { reply } });
  });

  // @route POST /api/v1/ai/explain   body: { passage, level? }
  static explain = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const passage = (req.body?.passage ?? '').toString().trim();
    if (!passage) return next(new ErrorResponse('A passage to explain is required', 400));

    await consumeAiQuota(req.user!, 'chat');
    const explanation = await AIService.explain(passage, req.body?.level);

    res.status(200).json({ success: true, data: { explanation } });
  });

  // @route POST /api/v1/ai/analyze-image   body: { imageUrl, asFlashcards? }
  static analyzeImage = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const imageUrl = (req.body?.imageUrl ?? '').toString().trim();
    if (!imageUrl) return next(new ErrorResponse('An imageUrl is required', 400));

    await consumeAiQuota(req.user!, 'flashcard');

    // Prefer a vision-capable provider (Gemini) — it OCRs *and* describes the
    // diagram/labels. Fall back to plain OCR (extractTextFromFile) otherwise.
    let text = '';
    const described = await AIService.analyzeImage(imageUrl).catch(() => null);
    if (described) {
      text = described;
    } else {
      try {
        text = await extractTextFromFile(imageUrl);
      } catch (err) {
        return next(new ErrorResponse('Image analysis is unavailable (configure GEMINI_API_KEY or OCR_SPACE_API_KEY)', 502));
      }
    }

    const payload: { text: string; flashcards?: unknown } = { text };
    if (req.body?.asFlashcards) {
      payload.flashcards = await AIService.generateFlashcards(text, Number(req.body?.count) || 6);
    }

    res.status(200).json({ success: true, data: payload });
  });
}
