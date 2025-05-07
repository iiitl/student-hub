import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IOTP extends Document {
  email: string
  otp: string
  expires: Date
  createdAt: Date
  updatedAt: Date
}

const OTPSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
      validate: {
        validator: function(v: string) {
          return /^\d{6}$/.test(v);
        },
        message: (props: { value: string }) => `${props.value} is not a valid 6-digit OTP!`
      }
    },
    expires: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Add index to automatically delete expired OTPs
OTPSchema.index({ expires: 1 }, { expireAfterSeconds: 0 })

// Add compound index for faster lookups
OTPSchema.index({ email: 1, otp: 1 })

// Ensure indexes are created
const ensureIndexes = async () => {
  try {
    if (mongoose.connection.readyState === 1) { // Connected
      console.log('Creating OTP indexes...');
      await mongoose.model('OTP').createIndexes();
      console.log('OTP indexes created successfully');
    }
  } catch (error) {
    console.error('Error creating OTP indexes:', error);
  }
};

// Prevent model redefinition in development
const OTP: Model<IOTP> =
  mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema)

// Create indexes if connected
if (mongoose.connection.readyState === 1) {
  ensureIndexes();
}

export default OTP 