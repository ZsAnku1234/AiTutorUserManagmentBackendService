// controllers/questionGenerator.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateQuestionsFromTopicsTool } from '../utils/generateQuestionsFromTopicsTool';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  timeToSolve: number;
}

export const generateQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { topics, subject, area } = req.body;

    if (!topics || !subject || !area) {
      res.status(400).json({ message: 'topics, subject, and area are required' });
      return;
    }

    const user = req.user;

    // Correct destructuring of the result
    const { questionSetId, questions } = await generateQuestionsFromTopicsTool(user, topics, subject, area);

    if (!questions || !questionSetId) {
      res.status(500).json({ message: 'Failed to generate questions' });
      return;
    }

    const questionsWithoutAnswers = questions.map(({ correctAnswer, ...rest }) => rest);

    res.status(200).json({
      success: true,
      questionSetId, // ✅ Include this in the response
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      questions: questionsWithoutAnswers,
    });

  } catch (err) {
    console.error('Error in generateQuestions:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
