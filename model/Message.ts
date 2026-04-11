import mongoose, { Document, Model } from 'mongoose'
import './User' // Ensure User model is registered

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId | Record<string, unknown>
  email: string
  content: string
  isEdited: boolean
  replyTo: mongoose.Types.ObjectId | Record<string, unknown> | null
  isDeleted: boolean
  timestamp: Date
}

const MessageSchema = new mongoose.Schema<IMessage>({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  content: { type: String, required: true },
  isEdited: { type: Boolean, default: false },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  isDeleted: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
})

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)
export default Message
