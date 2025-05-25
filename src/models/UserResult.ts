import mongoose, { Schema, Document, Types } from 'mongoose';

interface IDetailedResult {
  questionId: Types.ObjectId;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string | null;
}

export interface IUserResult extends Document {
    userId: Types.ObjectId;
    questionSetId: Types.ObjectId;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    percentage: number;
    detailedResults: IDetailedResult[];
    subject: string;
    area: string;
    topics: string[];
    botFeedback: string;
    createdAt: Date;
  }

const DetailedResultSchema = new Schema<IDetailedResult>({
  questionId: { type: Schema.Types.ObjectId, required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  userAnswer: { type: String, default: null },
});

const UserResultSchema = new Schema<IUserResult>({
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    questionSetId: { type: Schema.Types.ObjectId, required: true, ref: 'QuestionSet' },
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    incorrectAnswers: { type: Number, required: true },
    skippedQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    detailedResults: { type: [DetailedResultSchema], required: true },
    subject: { type: String, required: true },
    area: { type: String, required: true },
    topics: { type: [String], required: true },
    botFeedback: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  });

const UserResultModel = mongoose.model<IUserResult>('questionAnswersSet', UserResultSchema);

export default UserResultModel;
