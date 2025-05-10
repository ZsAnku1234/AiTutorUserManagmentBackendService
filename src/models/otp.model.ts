import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
    email: string;
    otp: string;
    createdAt: Date;
}

const OtpSchema: Schema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        otp: { type: String, required: true },
        createdAt: { type: Date, required: true },
    },
    { timestamps: true }
);

export const Otp = mongoose.model<IOtp>('Otp', OtpSchema);
