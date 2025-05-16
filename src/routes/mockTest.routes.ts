import express from 'express';
import { getChaptersJSON } from '../controllers/mockTest.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/getChapters', authenticate, getChaptersJSON);

export default router;
