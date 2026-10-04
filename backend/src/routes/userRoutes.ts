import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { RoleController } from '../controllers/roleController.js';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authJwt.js';
import { hasPermission } from '../middleware/roleGuard.js';
import { validateRegister, validateCreateStaffUser } from '../middleware/validator.js';

const router = Router();

// GET /api/v1/users - View all users with courses and roles (Admin only)
router.get('/', authenticate, hasPermission('users:view_all'), UserController.getAllUsers);

// POST /api/v1/users/students (or /student) - Create student only (Available to all roles)
router.post('/student', validateRegister, AuthController.register);
router.post('/students', validateRegister, AuthController.register);

// POST /api/v1/users - Create instructor or administrator (Admin only)
router.post('/', authenticate, hasPermission('users:create_staff'), validateCreateStaffUser, UserController.createStaffUser);
router.post('/staff', authenticate, hasPermission('users:create_staff'), validateCreateStaffUser, UserController.createStaffUser);

// GET /api/v1/users/:id - View single user details (Admin only)
router.get('/:id', authenticate, hasPermission('users:view_all'), UserController.getUserById);

// DELETE /api/v1/users/:id - Delete user (Admin only)
router.delete('/:id', authenticate, hasPermission('users:delete'), UserController.deleteUser);

// PATCH /api/v1/users/:id/role - Assign role to user
router.patch('/:id/role', authenticate, hasPermission('users:manage_roles'), RoleController.assignUserRole);

export default router;
