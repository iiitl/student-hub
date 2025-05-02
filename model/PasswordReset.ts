import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPasswordReset extends Document {
  email: string
  token: string
  expires: Date
  createdAt: Date
  updatedAt: Date
}

const PasswordResetSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
    },
    expires: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
  },
  {
    timestamps: true,
  }
)

// Add index to automatically delete expired tokens
PasswordResetSchema.index({ expires: 1 }, { expireAfterSeconds: 0 })

// Add compound index for email and token
PasswordResetSchema.index({ email: 1, token: 1 })

const PasswordReset: Model<IPasswordReset> =
  mongoose.models.PasswordReset ||
  mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema)

export default PasswordReset
