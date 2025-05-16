import { Schema, model, Document, Types } from 'mongoose';

export interface ISubjectCombination extends Document {
  user: Types.ObjectId;
  subjects: string[];
}

const SubjectCombinationSchema = new Schema<ISubjectCombination>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One combination list per user
  },
  subjects: {
    type: [String],
    default: []
  }
});

export const SubjectCombination = model<ISubjectCombination>('SubjectCombination', SubjectCombinationSchema);
