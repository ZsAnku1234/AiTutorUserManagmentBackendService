import mongoose, { Document, Schema } from "mongoose";

interface Book {
  name: string;
  chapters: string[];
}

export interface ChapterDocument extends Document {
  subject: string;
  board: string;
  classLevel: string;
  country: string;
  books: Book[];
  expiresAt: Date;
}

const BookSchema = new Schema<Book>({
  name: { type: String, required: true },
  chapters: [{ type: String, required: true }],
});

const ChapterSchema = new Schema<ChapterDocument>(
  {
    subject: { type: String, required: true },
    board: { type: String, required: true },
    classLevel: { type: String, required: true },
    country: { type: String, required: true },
    books: [BookSchema],
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

ChapterSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ChapterModel = mongoose.model<ChapterDocument>("Chapter", ChapterSchema);

export default ChapterModel;
