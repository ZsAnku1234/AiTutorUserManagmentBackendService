// routes/questionRoutes.ts
import express from 'express';
import { generateQuestions, getResults } from '../controllers/questionGenerator';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// POST /api/questions/generate
router.post('/generate', authenticate, generateQuestions);
router.post('/results',authenticate, getResults);

export default router;
