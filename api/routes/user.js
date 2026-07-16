import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getProfile, updateProfile, changePassword } from '../controllers/userController.js';

const router = express.Router();

router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);

export default router;
