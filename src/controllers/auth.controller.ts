import { Request, Response } from 'express';
import { User } from '../models/user.model';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import { Otp } from '../models/otp.model';
import { sendOtp } from '../utils/otpService';

const JWT_SECRET = process.env.JWT_SECRET || '';

export const signUp = async (req: Request, res: Response) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) return res.status(400).json({ message: 'Email already in use' });

    const user = new User(req.body);
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(401).send({ status: false, msg: "Invalid email" });
      return;
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(otp);

    // Save OTP to the database
    await Otp.findOneAndUpdate(
      { email: user.email },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    await sendOtp(user.email, otp);
    res.send({ status: true, msg: "OTP sent to email" });
    return;
  } catch (error) {
    res.status(500).send({ status: false, msg: "An error occurred" });
    return;
  }
};


export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord) {
      res.status(400).send({ status: false, msg: "OTP not found or expired" });
      return;
    }

    if (otpRecord.otp !== otp) {
      res.status(401).send({ status: false, msg: "Invalid OTP" });
      return;
    }

    // OTP is valid, proceed with the next steps (e.g., password reset)
    await Otp.deleteOne({ email }); // Remove OTP after successful verification
    res.send({ status: true, msg: "OTP verified successfully" });
    return;
  } catch (error) {
    res.status(500).send({ status: false, msg: "An error occurred" });
    return;
  }
};
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.updateOne({ email }, { password: hashedPassword });
    res.send({ status: true, msg: "Password reset successful" });
    return;
  } catch (error) {
    res.status(500).send({ status: false, msg: "An error occurred" });
    return;
  }
};