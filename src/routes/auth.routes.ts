import { RequestHandler, Router } from 'express';
import { forgotPassword, login, resetPassword, verifyOtp, signUp } from '../controllers/auth.controller';
import { validateSignup, validateLogin } from '../utils/validate';

const router = Router();

router.post('/signup', validateSignup, signUp as RequestHandler);
router.post('/login', validateLogin, login as RequestHandler);
// 🔐 Password Reset Routes
router.post('/forgot-password', forgotPassword as RequestHandler);
router.post('/verify-otp', verifyOtp as RequestHandler);
router.post('/reset-password', resetPassword as RequestHandler);

export default router;
