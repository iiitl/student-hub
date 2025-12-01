import mongoose, { Schema, Document, Model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

export interface IPaperUpdate {
  user: Schema.Types.ObjectId
  updatedAt: Date
}

export interface IPaper extends Document {
  facultyName: string
  title?: string // Optional for backward compatibility
  content: string
  subject: string
  year: number
  semester: number
  term: string
  document_url: string
  file_name: string
  file_type: string
  uploaded_by: Schema.Types.ObjectId
  updated_by: IPaperUpdate[]
}

const PaperSchema: Schema<IPaper> = new Schema<IPaper>(
  {
    facultyName: {
      type: String,
      trim: true,
      maxlength: [100, 'Faculty name must be withing 100 characters'],
    },
    title: {
      // Kept for backward compatibility
      type: String,
      trim: true,
      maxlength: [100, 'Title must be withing 100 characters'],
    },
    content: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Please enter subject name for given paper'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year of question paper is necessary'],
      validate: {
        validator: (v: number) =>
          Number.isInteger(v) && v >= 2015 && v <= new Date().getFullYear(),
        message: 'Year must be an integer between 2015 and the current year',
      },
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      validate: {
        validator: (v: number) => Number.isInteger(v) && v >= 1 && v <= 8,
        message: 'Semester must be an integer between 1 and 8',
      },
    },
    term: {
      type: String,
      enum: ['Mid', 'End', 'Class_test_1', 'Class_test_2', 'Class_test_3'],
      required: [true, 'Term of exam is required'],
      set: (v: string) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase(),
    },
    document_url: {
      type: String,
      required: [true, 'Document url is required for paper'],
    },
    file_name: {
      type: String,
      required: [true, 'File name is required'],
    },
    file_type: {
      type: String,
      required: [true, 'File type is required'],
    },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    updated_by: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
)

PaperSchema.plugin(aggregatePaginate)

const Paper: Model<IPaper> =
  mongoose.models.Paper || mongoose.model<IPaper>('Paper', PaperSchema)

export default Paper
