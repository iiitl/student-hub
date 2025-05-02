import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  password?: string
  image?: string
  googleId?: string
  createdAt: Date
  updatedAt: Date
  passwordSet: boolean
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      // Password is not required because of Google authentication
    },
    image: {
      type: String,
    },
    googleId: {
      type: String,
    },
    passwordSet: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Prevent model redefinition in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User 