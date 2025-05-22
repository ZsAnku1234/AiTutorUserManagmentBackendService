// routes/questionRoutes.ts
import express from 'express';
import { generateQuestions } from '../controllers/questionGenerator';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// POST /api/questions/generate
router.post('/generate', authenticate, generateQuestions);

export default router;
