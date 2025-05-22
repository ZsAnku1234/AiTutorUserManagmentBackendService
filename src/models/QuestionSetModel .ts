import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  timeToSolve: { type: Number, required: true } // time in seconds
});

const questionSetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  area: { type: String, required: true },
  topics: { type: [String], required: true },
  questions: { type: [questionSchema], required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("QuestionSet", questionSetSchema);
