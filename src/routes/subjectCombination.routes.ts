import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { addSubject, getSubjects } from '../controllers/subjectCombination.controller';

const router = Router();

router.post('/add', authenticate, addSubject); // add one subject
router.get('/get', authenticate, getSubjects); // get all subjects

export default router;
