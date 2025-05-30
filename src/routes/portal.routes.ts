import express from 'express';
import { getUserQuizStats, getSubjectPerformanceHistory } from '../controllers/portal.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/quiz-stats', authenticate, getUserQuizStats);
// URL-based pagination route
router.get('/subject-performance/:subject', authenticate, getSubjectPerformanceHistory);

export default router;