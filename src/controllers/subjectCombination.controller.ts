import { Request, Response } from 'express';
import { SubjectCombination } from '../models/subjectCombination.model';
import { AuthRequest } from '../middleware/auth';

export const addSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subject } = req.body;

    if (!subject || typeof subject !== 'string') {
      res.status(400).json({ message: 'Subject must be a string.' });
      return;
    }

    const formattedSubject = subject.trim().charAt(0).toUpperCase() + subject.trim().slice(1).toLowerCase();
    const userId = req.user._id;

    let record = await SubjectCombination.findOne({ user: userId });

    if (!record) {
      // First subject for the user
      record = await SubjectCombination.create({
        user: userId,
        subjects: [formattedSubject]
      });
    } else {
      const normalizedSubjects = record.subjects.map(s => s.toLowerCase());
      if (normalizedSubjects.includes(formattedSubject.toLowerCase())) {
        res.status(400).json({ message: 'Subject already exists for this user.' });
        return;
      }

      record.subjects.push(formattedSubject);
      await record.save();
    }

    res.status(200).json({ message: 'Subject added successfully.', subjects: record.subjects });
    return;

  } catch (error: any) {
    res.status(500).json({ message: error.message });
    return;
  }
};

export const getSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;

    const record = await SubjectCombination.findOne({ user: userId });

    if (!record) {
      res.status(200).json({ subjects: [] });
      return;
    }

    res.status(200).json({ subjects: record.subjects });
    return;

  } catch (error: any) {
    res.status(500).json({ message: error.message });
    return;
  }
};
