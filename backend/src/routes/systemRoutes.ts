import { Router } from 'express';
import { SystemController } from '../controllers/systemController.js';
import { authenticate } from '../middleware/authJwt.js';
import { hasPermission } from '../middleware/roleGuard.js';

const router = Router();

router.get('/health', SystemController.health);
router.get('/metrics', authenticate, hasPermission('system:monitor'), SystemController.metrics);
router.get('/sentry-test', SystemController.sentryTest);


export default router;
