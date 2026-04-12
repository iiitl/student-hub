import mongoose, { Document, Model } from 'mongoose'
import './User' // Ensure User model is registered before populate() calls

/**
 * TypeScript interface representing a single Message document in MongoDB.
 *
 * This interface extends Mongoose's `Document` to provide type safety when
 * working with message instances in API route handlers and population calls.
 *
 * @property sender    - Reference to the User who authored this message.
 *                        Stored as an ObjectId in the database; resolved to a
 *                        populated user object (with `name`, `image`, `email`)
 *                        when `.populate('sender')` is called.
 * @property email     - The sender's email address at the time of message
 *                        creation. Stored denormalised for fast domain checks
 *                        without needing to populate the sender.
 * @property content   - The text body of the message. Replaced with a tombstone
 *                        string (`🚫 This message was deleted.`) on soft delete.
 * @property isEdited  - Flag set to `true` after the message content has been
 *                        modified via PATCH. Displayed as "(edited)" in the UI.
 * @property replyTo   - Optional reference to another Message document when this
 *                        message is a reply. `null` for top-level messages.
 * @property isDeleted - Soft-delete flag. When `true`, the message is rendered
 *                        as italic/faded with an action menu limited to prevent
 *                        further interaction (no reply, edit, or delete).
 * @property timestamp - The creation date of the message. Defaults to `Date.now`
 *                        via the schema.
 */
export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId | Record<string, unknown>
  email: string
  content: string
  isEdited: boolean
  replyTo: mongoose.Types.ObjectId | Record<string, unknown> | null
  isDeleted: boolean
  timestamp: Date
}

/**
 * Mongoose schema definition for the Message collection.
 *
 * Key design decisions:
 * - `sender` uses an ObjectId ref to `User`, enabling `.populate()` for
 *   display-ready sender data in API responses and SSE payloads.
 * - `replyTo` is a self-referencing ObjectId ref to `Message`, supporting
 *   one level of reply chain nesting with recursive populate.
 * - `isDeleted` enables soft deletes — the document is preserved for reply
 *   chain integrity, with content replaced by a tombstone string.
 * - `timestamp` defaults to `Date.now` for automatic creation dating.
 */
const MessageSchema = new mongoose.Schema<IMessage>({
  /** Reference to the User document representing the message author. */
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  /** Denormalised email of the sender for quick domain validation. */
  email: { type: String, required: true },
  /** The text body of the message; replaced with tombstone on soft delete. */
  content: { type: String, required: true },
  /** Whether the message has been edited after initial creation. */
  isEdited: { type: Boolean, default: false },
  /** Optional self-reference to the parent message in a reply chain. */
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  /** Soft-delete flag; when true, the message is rendered as deleted. */
  isDeleted: { type: Boolean, default: false },
  /** Creation timestamp; auto-set to the current date on insert. */
  timestamp: { type: Date, default: Date.now },
})

/**
 * Mongoose model for the `messages` collection in MongoDB.
 *
 * Uses the `mongoose.models` cache to avoid re-compiling the model during
 * Next.js Hot Module Replacement (HMR) in development. If the model has
 * already been registered (e.g., from a previous HMR cycle), the cached
 * version is reused; otherwise, a fresh model is created from the schema.
 */
const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)
export default Message

