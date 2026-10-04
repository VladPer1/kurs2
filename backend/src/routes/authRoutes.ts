import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { UserController } from '../controllers/userController.js';
import { validateRegister, validateLogin, validateCreateStaffUser } from '../middleware/validator.js';
import { authLoginLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/authJwt.js';
import { hasPermission } from '../middleware/roleGuard.js';

const router = Router();

// Student registration (Public - available to all roles)
router.post('/register', validateRegister, AuthController.register);
router.post('/register/student', validateRegister, AuthController.register);

// Staff creation (Instructor / Administrator - Admin only)
router.post('/register/staff', authenticate, hasPermission('users:create_staff'), validateCreateStaffUser, UserController.createStaffUser);

router.post('/login', authLoginLimiter, validateLogin, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
