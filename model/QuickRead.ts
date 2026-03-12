import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IQuickRead extends Document {
  title: string
  description?: string
  url: string
  category: string
  source?: string
  uploadedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const QuickReadSchema = new Schema<IQuickRead>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    source: {
      type: String,
      trim: true,
      default: 'StudentHub',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

const QuickRead: Model<IQuickRead> =
  mongoose.models.QuickRead ||
  mongoose.model<IQuickRead>('QuickRead', QuickReadSchema)

export default QuickRead
