import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import UserResultModel from '../models/UserResult';
import { SubjectCombination } from '../models/subjectCombination.model';

export const getUserQuizStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // First, get the user's registered subjects
    const subjectRecord = await SubjectCombination.findOne({ user: user._id });
    const userSubjects = subjectRecord?.subjects || [];

    // Get stats using MongoDB aggregation
    const statsFromDB = await UserResultModel.aggregate([
      // Match only the current user's results
      { $match: { userId: user._id } },
      // Group by subject
      {
        $group: {
          _id: "$subject",
          totalQuizzes: { $sum: 1 },
          totalQuestions: { $sum: "$totalQuestions" },
          totalCorrect: { $sum: "$correctAnswers" },
          totalWrong: { $sum: "$incorrectAnswers" },
          totalSkipped: { $sum: "$skippedQuestions" },
          // Collect all topics into an array
          allTopics: { $push: "$topics" },
        }
      },
      // Calculate average percentage
      {
        $project: {
          _id: 0,
          subject: "$_id",
          totalQuizzes: 1,
          totalQuestions: 1,
          totalCorrect: 1,
          totalWrong: 1,
          totalSkipped: 1,
          averagePercentage: {
            $toString: {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$totalCorrect", "$totalQuestions"] },
                    100
                  ]
                },
                2
              ]
            }
          },
          // Flatten and get unique topics
          topics: {
            $reduce: {
              input: "$allTopics",
              initialValue: [],
              in: { $setUnion: ["$$value", "$$this"] }
            }
          }
        }
      }
    ]);

    // Create a map of existing stats
    const statsMap = new Map(statsFromDB.map(stat => [stat.subject, stat]));

    // Ensure all registered subjects have stats (even if no quizzes taken)
    const subjectStats = userSubjects.map(subject => {
      return statsMap.get(subject) || {
        subject,
        totalQuizzes: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalSkipped: 0,
        averagePercentage: "0.00",
        topics: []
      };
    });

    res.status(200).json({
      success: true,
      stats: subjectStats
    });

  } catch (error) {
    console.error('Error fetching user quiz stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSubjectPerformanceHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const subject = req.params.subject;
    const page = parseInt(req.query.page as string || '1');
    const ITEMS_PER_PAGE = 10;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const quizHistory = await UserResultModel.aggregate([
      {
        $match: {
          userId: user._id,
          subject: subject
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $skip: skip
      },
      {
        $limit: ITEMS_PER_PAGE
      },
      {
        $project: {
          _id: 1,
          date: "$createdAt",
          percentage: 1,
          totalQuestions: 1,
          correctAnswers: 1,
          incorrectAnswers: 1,
          skippedQuestions: 1,
          topics: 1
        }
      }
    ]);

    const totalQuizzes = await UserResultModel.countDocuments({
      userId: user._id,
      subject: subject
    });

    const totalPages = Math.ceil(totalQuizzes / ITEMS_PER_PAGE);

    res.status(200).json({
      quizzes: quizHistory,
      currentPage: page,
      totalPages
    });

  } catch (error) {
    console.error('Error fetching subject quizzes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



