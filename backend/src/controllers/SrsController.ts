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

  // @route GET /api/v1/srs/cards?page=1&limit=50 — the user's whole deck
  static getCards = asyncHandler(async (req: CustomRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const result = await SrsService.getAllCards(req.user!.id, page, limit);
    res.status(200).json({
      success: true,
      count: result.total,
      totalPages: result.totalPages,
      currentPage: result.page,
      data: result.cards,
    });
  });

  // @route DELETE /api/v1/srs/cards/:cardId
  static deleteCard = asyncHandler(async (req: CustomRequest, res: Response) => {
    await SrsService.deleteCard(req.user!.id, req.params.cardId);
    res.status(200).json({ success: true, data: {} });
  });

  // @route POST /api/v1/srs/review   body: { cardId, quality }
  static reviewCard = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { cardId, quality } = req.body ?? {};
    if (!cardId) return next(new ErrorResponse('cardId is required', 400));
    const card = await SrsService.gradeCard(req.user!.id, cardId, Number(quality));
    res.status(200).json({ success: true, data: card });
  });
}
