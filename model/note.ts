import mongoose, { Schema, Document, Model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

export interface INoteUpdate {
  user: Schema.Types.ObjectId
  updatedAt: Date
}

export interface INote extends Document {
  facultyName: string
  content?: string
  subject: string
  year: number
  semester: number
  term: string
  category: 'academic' | 'axios'
  document_url: string
  storage_asset_id: string
  file_name: string
  file_type: string
  uploaded_by: Schema.Types.ObjectId
  updated_by: INoteUpdate[]
}

const NoteSchema: Schema<INote> = new Schema<INote>(
  {
    facultyName: {
      type: String,
      required: [true, 'Faculty name is mandatory for notes'],
      trim: true,
      maxlength: [100, 'Faculty name must be withing 100 characters'],
    },
    content: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Please enter subject name for given note'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year of note is necessary'],
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
      enum: ['Mid', 'End'],
      required: [true, 'Exam type (term) is required'],
      set: (v: string) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase(),
    },
    category: {
      type: String,
      enum: ['academic', 'axios'],
      default: 'academic',
    },
    document_url: {
      type: String,
      required: [true, 'Document url is required for note'],
    },
    storage_asset_id: {
      type: String,
      required: [true, 'Storage asset ID is required for file deletion'],
      trim: true,
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

NoteSchema.plugin(aggregatePaginate)

const Note: Model<INote> =
  mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema)

export default Note
