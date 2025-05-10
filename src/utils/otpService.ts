import { google } from 'googleapis';
const OAuth2 = google.auth.OAuth2;
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN// Your Refresh Token
  });
  
export async function sendOtp(email: string, otp: string): Promise<void> {
    console.log(email, otp);
  
    try {
      const accessToken = await oauth2Client.getAccessToken();
  
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.PROJECT_ID,
          clientId:process.env.GOOGLE_CLIENT_ID,
          clientSecret:process.env.GOOGLE_CLIENT_SECRET,
          refreshToken:process.env.REFRESH_TOKEN,
          accessToken: accessToken.token || "",
        },
      });
  
      const mailOptions = {
        from: process.env.PROJECT_ID,
        to: email,
        subject: 'MyDreamFy OTP Code',
        text: `Hello,
  
  Thank you for using AI-tutor. Your one-time password (OTP) is: ${otp}
  
  Please use this code to complete your verification process. If you did not request this code, please ignore this email.
  
  Best regards,
  The MyDreamFy Team`,
      };
  
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }