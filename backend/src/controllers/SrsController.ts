import { Response, NextFunction } from 'express';
import asyncHandler from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';
import { CustomRequest } from '../middleware/auth';
import SrsService from '../services/SrsService';

/**
 * Endpoints for the Spaced Repetition System. Students build a review deck from
 * generated flashcards, fetch what's due, and grade their recall — the service
 * reschedules each card via SM-2.
 */
export default class SrsController {
  // @route POST /api/v1/srs/cards   body: { cards: [{question, answer}], noteId? }
  static addCards = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { cards, noteId } = req.body ?? {};
    if (!Array.isArray(cards)) {
      return next(new ErrorResponse('cards must be an array', 400));
    }
    const added = await SrsService.addCards(req.user!.id, cards, noteId);
    res.status(201).json({ success: true, data: { added } });
  });

  // @route GET /api/v1/srs/due?limit=20
  static getDue = asyncHandler(async (req: CustomRequest, res: Response) => {
    const limit = Number(req.query.limit) || 20;
    const cards = await SrsService.getDueCards(req.user!.id, limit);
    res.status(200).json({ success: true, count: cards.length, data: cards });
  });

  // @route POST /api/v1/srs/review   body: { cardId, quality }
  static reviewCard = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { cardId, quality } = req.body ?? {};
    if (!cardId) return next(new ErrorResponse('cardId is required', 400));
    const card = await SrsService.gradeCard(req.user!.id, cardId, Number(quality));
    res.status(200).json({ success: true, data: card });
  });
}
