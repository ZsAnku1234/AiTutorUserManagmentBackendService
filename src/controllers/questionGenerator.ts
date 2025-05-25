// controllers/questionGenerator.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateQuestionsFromTopicsTool } from '../utils/generateQuestionsFromTopicsTool';
import QuestionSetModel from '../models/QuestionSetModel ';
import UserResultModel from '../models/UserResult';
import { feedbackGenerator } from '../utils/feedbackGenerator';
import { TTSModel } from '../utils/TTSModel';

interface Answer {
  questionId: string;
  selectedOption: string | null;
}


export const generateQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { topics, subject, feedback } = req.body;

    if (!topics || !subject || !feedback) {
      res.status(400).json({ message: 'topics, subject, and area are required' });
      return;
    }

    const user = req.user;

    // Correct destructuring of the result
    const { questionSetId, questions } = await generateQuestionsFromTopicsTool(user, topics, subject, feedback);

    if (!questions || !questionSetId) {
      res.status(500).json({ message: 'Failed to generate questions' });
      return;
    }

    const questionsWithoutAnswers = questions;

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

export const getResults = async (req: AuthRequest, res: Response): Promise<void> => {
  const { questionSetId, answers } = req.body;

  if (!questionSetId || !Array.isArray(answers)) {
    res.status(400).json({ message: 'questionSetId and answers are required' });
    return;
  }

  const user = req.user;
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const questionSet = await QuestionSetModel.findById(questionSetId).lean();
    if (!questionSet) {
      res.status(404).json({ message: 'Question set not found' });
      return;
    }

    const totalQuestions = questionSet.questions.length;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let skippedQuestions = 0;

    const answerMap = new Map(answers.map((a: Answer) => [a.questionId, a.selectedOption]));

    const detailedResults = questionSet.questions.map((question: any) => {
      const userAnswer = answerMap.get(String(question._id)) ?? null;

      if (userAnswer === null) skippedQuestions++;
      else if (userAnswer === question.correctAnswer) correctAnswers++;
      else incorrectAnswers++;

      return {
        questionId: question._id,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        userAnswer,
      };
    });

    const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    const Botfeedback = await feedbackGenerator({
      user:user,
      name:user.name,
      questions: detailedResults,
      subject: questionSet.subject,
      feedback: questionSet.feedback,
      topics: questionSet.topics,
    });
    const userResult = new UserResultModel({
      userId: user._id,
      questionSetId,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      skippedQuestions,
      percentage,
      detailedResults,
      subject: questionSet.subject,
      area: questionSet.feedback,
      topics: questionSet.topics,
      botFeedback:Botfeedback
    });

    await userResult.save();

    // Delete question set after saving results
  //  await QuestionSetModel.findByIdAndDelete(questionSetId);
  const audioBuffer = await TTSModel(Botfeedback);
  const audioBase64 = audioBuffer?.toString('base64');

    res.status(200).json({
      success: true,
      result: {
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        skippedQuestions,
        percentage,
        detailedResults,
        subject: questionSet.subject,
        feedback: questionSet.feedback,
        topics: questionSet.topics,
        Botfeedback:Botfeedback,
        audioBase64:audioBase64
      },
    });
  } catch (error) {
    console.error('Error calculating or saving results:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


