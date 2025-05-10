// routes/user.ts
import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { updateUserProfile } from '../controllers/user.controller';

const router = express.Router();

router.get('/getUser', authenticate, function(req: AuthRequest, res) {
  res.status(200).json(req.user);
});

router.put('/update', authenticate, function(req: AuthRequest, res) {
  updateUserProfile(req, res);
});

export default router;
