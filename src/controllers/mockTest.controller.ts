import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { GetAllChapters } from '../utils/OpenAIChaptersFinderTool';

export const getChaptersJSON = async (req: AuthRequest, res: Response): Promise<void> => {
  const subject = req.query.subject as string;
  const user = req.user;

  if (!user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!subject || typeof subject !== 'string') {
    res.status(400).json({ message: 'Subject is required and must be a string' });
    return;
  }
const chapterJson=await GetAllChapters(user,subject);
  console.log(user);
  res.json(chapterJson);

};
