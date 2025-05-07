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
  emailVerified: boolean
  roles: string[]
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
    emailVerified: {
      type: Boolean,
      default: false,
    },
    roles: {
      type: [String],
      enum: ['user', 'admin'],
      default: ['user'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Delete the model if it exists to prevent the "Cannot overwrite model once compiled" error
if (mongoose.models.User) {
  delete mongoose.models.User
}

// Create and export the model
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema)

export default User
