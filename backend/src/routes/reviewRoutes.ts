import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authJwt.js';

const router = Router();

router.put('/:id', authenticate, ReviewController.update);
router.delete('/:id', authenticate, ReviewController.delete);

export default router;
