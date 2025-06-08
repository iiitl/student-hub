import mongoose, { Schema, Model } from 'mongoose'

export interface IOTP {
  email: string
  otp: string
  expires: Date
  verified: boolean
  attempts: number
  lastAttempt: Date
  createdAt: Date
  updatedAt: Date
  ipAddress: string
  userAgent: string
  generationCount: number
  lastGeneration: Date
}

const OTPSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@iiitl\.ac\.in$/,
        'Please enter a valid IIITL email address',
      ],
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
      minlength: [6, 'OTP must be 6 digits'],
      maxlength: [6, 'OTP must be 6 digits'],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      max: [3, 'Maximum verification attempts exceeded'],
    },
    lastAttempt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    expires: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: { expireAfterSeconds: 0 },
    },
    generationCount: {
      type: Number,
      default: 0,
      max: [5, 'Maximum OTP generation attempts exceeded'],
    },
    lastGeneration: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Add indexes for better query performance
OTPSchema.index({ email: 1, otp: 1 })
OTPSchema.index({ email: 1, verified: 1 })
OTPSchema.index({ ipAddress: 1, createdAt: 1 })
OTPSchema.index({ email: 1, generationCount: 1 })

// Prevent model redefinition in development
const OTP: Model<IOTP> =
  mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema)

// Create indexes if connected
if (mongoose.connection.readyState === 1) {
  OTP.createIndexes().catch(console.error)
}

export default OTP
