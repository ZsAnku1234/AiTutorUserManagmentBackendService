import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import SubjectCombination from './routes/subjectCombination.routes';
import chapters  from './routes/mockTest.routes'
import cors from 'cors';
import questionRoutes from './routes/questionRoutes';
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/subject', SubjectCombination)
app.use('/api/mock',chapters)
app.use('/api/questions', questionRoutes)

mongoose.connect(process.env.MONGODB_URI || '')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error', err));

export default app;
