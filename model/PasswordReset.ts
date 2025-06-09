import mongoose, { Schema, Model } from 'mongoose'

export interface IPasswordReset {
  email: string
  token: string
  expires: Date
  used: boolean
  attempts: number
  lastAttempt: Date
  createdAt: Date
  updatedAt: Date
}

const PasswordResetSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
      unique: true,
      index: true,
    },
    expires: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: { expireAfterSeconds: 0 }, // TTL index to automatically delete expired documents
    },
    used: {
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
  },
  {
    timestamps: true,
    collection: 'password_resets', // Explicitly set collection name
  }
)

// Add indexes for better query performance
PasswordResetSchema.index({ email: 1, used: 1 })
PasswordResetSchema.index({ email: 1, expires: 1 })

// Prevent model redefinition in development
const PasswordReset: Model<IPasswordReset> =
  mongoose.models.PasswordReset ||
  mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema)

// Create indexes if connected
if (mongoose.connection.readyState === 1) {
  PasswordReset.createIndexes().catch(console.error)
}

export default PasswordReset
