import express from 'express';
import { protect } from '../middleware/auth';
import SrsController from '../controllers/SrsController';

const router = express.Router();

router.use(protect);

router.post('/cards', SrsController.addCards);
router.get('/due', SrsController.getDue);
router.post('/review', SrsController.reviewCard);

export default router;
