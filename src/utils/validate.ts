import { Request, Response, NextFunction } from 'express';

export const validateSignup = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password, name, lastName } = req.body;

  if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
    res.status(400).json({ message: 'Invalid email' });
    return;
  }

  if (!password || password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters' });
    return;
  }

  if (!name || !lastName) {
    res.status(400).json({ message: 'Name and LastName are required' });
    return;
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  next();
};
