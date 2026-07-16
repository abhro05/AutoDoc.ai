import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createGeneration,
  getGenerations,
  getGeneration,
  deleteGeneration,
} from '../controllers/generationController.js';

const router = express.Router();

router.post('/', authenticate, createGeneration);
router.get('/', authenticate, getGenerations);
router.get('/:id', authenticate, getGeneration);
router.delete('/:id', authenticate, deleteGeneration);

export default router;
