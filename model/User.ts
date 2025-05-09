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
  lastLogin: Date
  loginAttempts: number
  lockUntil: Date
}

const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      index: true, // Create a single index
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      // Password is not required because of Google authentication
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't include password in queries by default
    },
    image: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || v.startsWith('https://')
        },
        message: 'Image URL must be HTTPS',
      },
    },
    googleId: {
      type: String,
      index: true, // Create a single index
      sparse: true, // Allow null values but maintain uniqueness
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
      index: true, // Create a single index
    },
    lastLogin: {
      type: Date,
      default: Date.now,
      index: true, // Create a single index
    },
    loginAttempts: {
      type: Number,
      default: 0,
      max: [5, 'Maximum login attempts exceeded'],
    },
    lockUntil: {
      type: Date,
      index: true, // Create a single index
    },
  },
  {
    timestamps: true,
  }
)

UserSchema.pre('find', function (next) {
  // Unlock accounts where lockUntil date has passed
  this.find({
    lockUntil: { $lt: new Date() },
  })
    .updateMany({
      $set: { loginAttempts: 0, lockUntil: null },
    })
    .exec()

  next()
})

// Method to check if user has a specific role
UserSchema.methods.hasRole = function (role: string): boolean {
  return this.roles.includes(role)
}

// Method to check if user is an admin
UserSchema.methods.isAdmin = function (): boolean {
  return this.roles.includes('admin')
}

// Create and export the model
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
