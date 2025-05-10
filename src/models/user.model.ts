import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  lastName: string;
  email: string;
  password: string;
  country: string;
  classLevel: string;
  board: string;
  currentGrade: string;
  gradeExpectation: string;
  weakness: string;
  strength: string;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^\S+@\S+\.\S+$/,
  },
  password: { type: String, required: true, minlength: 6 },
  country: { type: String },
  classLevel: { type: String },
  board: { type: String },
  currentGrade: { type: String },
  gradeExpectation: { type: String },
  weakness: { type: String },
  strength: { type: String },
}, { timestamps: true });

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (password: string) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
