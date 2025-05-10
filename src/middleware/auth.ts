// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model'

export interface AuthRequest extends Request {
    user?: any; // can be typed better if needed
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    console.log(authHeader)

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Authorization header missing or malformed' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);

        if (typeof decoded === 'string') {
            res.status(400).json({ message: 'Invalid token payload: string received' });
            return;
        }

        // Log the decoded token to verify its contents
        interface JwtPayloadWithId extends jwt.JwtPayload {
            id: string;
        }
        const payload = decoded as JwtPayloadWithId;

        // Log the decoded token to verify its contents
        console.log("data:::", payload); // Should output: data::: { id: '681e54c0539b826f42f118f9', iat: 1746820335, exp: 1747425135 }

        // Extract the user ID from the decoded payload
        const userId = payload.id;

        // Find the user by ID, excluding the password field
        const user = await User.findById(userId).select('-password');

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

