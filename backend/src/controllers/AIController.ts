import { Response, NextFunction } from 'express';
import asyncHandler from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';
import { CustomRequest } from '../middleware/auth';
import Note, { INote } from '../models/Note';
import SrsCard from '../models/SrsCard';
import AIService from '../services/AIService';
import SrsService from '../services/SrsService';
import { extractTextFromFile } from '../utils/extractTextFromFile';
import { consumeAiQuota } from '../utils/aiUsage';
import { AI_MAX_SOURCE_CHARS, AI_RESULT_TTL } from '../config/aiConfig';
import cache from '../utils/cache';
import { getLastAIProviderName } from '../services/ai';

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

    // Targeted update, NOT note.save(): a full save re-validates every legacy
    // subdocument, and old notes with malformed ratings entries were failing
    // with "Path `value` is required" — blocking summaries entirely.
    await Note.findByIdAndUpdate(note._id, { aiSummary: summary });

    res.status(200).json({ success: true, data: { summary, provider: getLastAIProviderName() } });
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
    const noteContext = `"${note.title}" — ${note.subject}, Grade ${note.grade}`;
    const flashcards = await AIService.generateFlashcards(source, count, noteContext);
    await cache.set(cacheKey, flashcards, AI_RESULT_TTL);

    if (req.body?.save) {
      // $push instead of note.save(): avoids re-validating legacy subdocuments
      await Note.findByIdAndUpdate(note._id, { $push: { flashcards: { $each: flashcards } } });
    }

    res.status(200).json({
      success: true,
      count: flashcards.length,
      data: { flashcards, provider: getLastAIProviderName() },
    });
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
    const noteContext = `"${note.title}" — ${note.subject}, Grade ${note.grade}`;
    const questions = await AIService.generateQuiz(source, count, noteContext);
    await cache.set(cacheKey, questions, AI_RESULT_TTL);

    res.status(200).json({
      success: true,
      count: questions.length,
      data: { questions, provider: getLastAIProviderName() },
    });
  });

  // @route POST /api/v1/ai/chat   body: { message, history?: [{role:'user'|'bot', text}] }
  static chat = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const message = (req.body?.message ?? '').toString().trim();
    if (!message) return next(new ErrorResponse('A message is required', 400));

    // Sanitize client-supplied history down to a bounded, typed transcript.
    const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
    const history = rawHistory
      .filter((t: any) => t && (t.role === 'user' || t.role === 'bot') && typeof t.text === 'string')
      .slice(-10)
      .map((t: any) => ({ role: t.role as 'user' | 'bot', text: t.text }));

    await consumeAiQuota(req.user!, 'chat');

    // Live coaching context: profile stats + how many review cards are due now.
    const dueCount = await SrsCard.countDocuments({
      user: req.user!.id,
      dueDate: { $lte: new Date() },
    }).catch(() => 0);
    const context = `${AIController.userContext(req)} ${dueCount} flashcards due for review right now.`;

    const reply = await AIService.chat(message, context, history);

    res.status(200).json({ success: true, data: { reply, provider: getLastAIProviderName() } });
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
