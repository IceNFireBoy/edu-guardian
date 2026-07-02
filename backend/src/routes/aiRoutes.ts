import express from 'express';
import { protect } from '../middleware/auth';
import AIController from '../controllers/AIController';
import { createLimiter } from '../middleware/rateLimiters';

const router = express.Router();

// AI endpoints are relatively expensive; a modest per-IP limiter backs up the
// per-user daily quota enforced in the controllers.
const aiLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: 'Too many AI requests. Please slow down for a moment.' },
  skip: () => process.env.NODE_ENV === 'test',
});

router.use(protect, aiLimiter);

router.post('/notes/:id/summary', AIController.summarizeNote);
router.post('/notes/:id/flashcards', AIController.generateFlashcards);
router.post('/notes/:id/quiz', AIController.generateQuiz);
router.post('/chat', AIController.chat);
router.post('/explain', AIController.explain);
router.post('/analyze-image', AIController.analyzeImage);

export default router;
