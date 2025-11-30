import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ILog extends Document {
  user: mongoose.Types.ObjectId
  action: string
  paper?: mongoose.Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
  details?: string
}

const LogSchema: Schema<ILog> = new Schema<ILog>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    action: {
      type: String,
      required: [true, 'Action done is required'],
    },
    paper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paper',
      required: false,
    },
    details: {
      type: String,
    },
  },
  { timestamps: true }
)

const Log: Model<ILog> =
  mongoose.models.Log || mongoose.model<ILog>('Log', LogSchema)

export default Log
