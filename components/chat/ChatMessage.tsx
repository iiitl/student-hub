import React, { useState } from 'react'
import Image from 'next/image'
import { MoreHorizontal, Edit2, Reply, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

/**
 * Represents the populated sender metadata for a chat message.
 *
 * When the `sender` field of a Mongoose Message document is populated via
 * `.populate('sender', 'name image email')`, it resolves to this shape
 * instead of a raw ObjectId string.
 *
 * @property _id    - The MongoDB ObjectId of the User document.
 * @property name   - The display name of the sender.
 * @property image  - Optional avatar URL sourced from the user's profile.
 * @property email  - The sender's email address (used for domain checks).
 */
export interface Sender {
  _id: string
  name: string
  image?: string
  email: string
}

/**
 * Represents a single broadcasted chat message object as received from the
 * API or via an SSE event.
 *
 * @property _id       - The MongoDB ObjectId string uniquely identifying this message.
 * @property content   - The text body of the message (replaced on soft-delete).
 * @property sender    - Either a populated `Sender` object or a raw ObjectId string
 *                        when population has not been performed.
 * @property isEdited  - Flag indicating whether the message content has been
 *                        modified after initial creation.
 * @property isDeleted - Flag indicating a soft-delete; content is replaced with
 *                        a tombstone string and the message is rendered as italic/faded.
 * @property replyTo   - Optionally populated parent message when this message is
 *                        a reply. Contains at least `_id`, `content`, and nested
 *                        `sender` fields. `null` when the message is top-level.
 * @property timestamp - ISO 8601 date string of when the message was created.
 */
export interface MessageData {
  _id: string
  content: string
  sender: Sender | string // Populated or ID
  isEdited: boolean
  isDeleted: boolean
  replyTo?: Record<string, unknown> | null
  timestamp: string
}

/**
 * Props accepted by the {@link ChatMessage} component.
 *
 * @property message        - The fully populated message data to render.
 * @property currentUserId  - The authenticated user's ID; used to determine
 *                             ownership for edit/delete actions and alignment.
 * @property onReply        - Callback invoked when the user clicks "Reply";
 *                             receives the target message so the parent can
 *                             enter reply mode.
 * @property onEdit         - Callback invoked when the user clicks "Edit";
 *                             receives the target message so the parent can
 *                             populate the input field with the existing content.
 * @property onDelete       - Callback invoked when the user confirms deletion;
 *                             receives the message ID to issue the DELETE request.
 */
interface ChatMessageProps {
  message: MessageData
  currentUserId: string | undefined
  onReply: (message: MessageData) => void
  onEdit: (message: MessageData) => void
  onDelete: (messageId: string) => void
}

/**
 * Renders a single chat message bubble with contextual action controls.
 *
 * Layout behaviour:
 * - Messages from the current user (`isMe`) are right-aligned with a
 *   primary-coloured bubble and no avatar.
 * - Messages from other users are left-aligned with a muted bubble,
 *   an avatar, and a sender name label.
 *
 * Action menu items:
 * - **Reply** – Available on all non-deleted messages. Disabled/hidden when
 *   the message has been soft-deleted to prevent replying to tombstones.
 * - **Edit** – Available only to the message owner and only when the message
 *   has not been soft-deleted.
 * - **Delete** – Available only to the message owner and only when the
 *   message has not been soft-deleted. Opens a confirmation modal.
 *
 * Soft-deleted messages are rendered with reduced opacity and italic text,
 * and their action menu is limited to prevent meaningless interactions.
 *
 * @param props - See {@link ChatMessageProps} for property descriptions.
 * @returns A React element representing the message bubble + action overlay.
 */
export default function ChatMessage({
  message,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
}: ChatMessageProps) {
  /*
   * Resolve the sender to a typed Sender object if the field has been
   * populated. Falls back to `null` when the sender is still a raw
   * ObjectId string (should not happen in normal flow).
   */
  const sender =
    typeof message.sender === 'object' ? (message.sender as Sender) : null

  /** Whether the current authenticated user is the author of this message. */
  const isMe = sender?._id === currentUserId

  /** Local loading state for the async delete operation. */
  const [isDeleting, setIsDeleting] = useState(false)

  /** Controls visibility of the delete confirmation modal overlay. */
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  /**
   * Opens the delete confirmation modal. Called when the user clicks the
   * "Delete" option in the dropdown menu.
   */
  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  /**
   * Executes the soft-delete mutation after the user confirms in the modal.
   * Sets `isDeleting` to disable the button during the async operation and
   * dismisses the modal on success.
   */
  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(message._id)
      setShowDeleteModal(false)
    } finally {
      setIsDeleting(false)
    }
  }

  /**
   * Converts an ISO 8601 date string to a localised time display
   * (e.g., "02:45 PM"). Returns an empty string if the date is invalid
   * to avoid rendering "Invalid Date" in the UI.
   *
   * @param dateString - The raw ISO timestamp string from the message.
   * @returns A formatted time string, or empty string on failure.
   */
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Guard against invalid date objects (e.g. malformed strings)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <>
      {/* Delete Confirmation Modal — rendered as a fixed overlay with backdrop blur */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card text-card-foreground p-6 rounded-xl shadow-xl w-[90%] max-w-md border animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold mb-2">Delete Message</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this message? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Message row — flex-row-reverse for own messages to right-align */}
      <div
        className={`flex w-full mb-4 group ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}
      >
        {/* Avatar — only shown for messages from other users */}
        {!isMe && (
          <div className="flex-shrink-0 mb-1">
            {sender?.image ? (
              <Image
                src={sender.image}
                alt={sender.name || 'User'}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border border-border/50 object-cover"
              />
            ) : (
              /* Fallback avatar: first character of name on a coloured circle */
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
                {sender?.name?.charAt(0) || '?'}
              </div>
            )}
          </div>
        )}

        {/* Message Content Container */}
        <div
          className={`flex flex-col relative max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}
        >
          {/* Sender name label — only displayed for other users' messages */}
          {!isMe && (
            <span className="text-xs text-muted-foreground ml-1 mb-1 font-medium">
              {sender?.name}
            </span>
          )}

          {/* Reply Context — shows the parent message snippet when this is a reply */}
          {message.replyTo && (
            <div
              className={`text-xs p-2 rounded-t-lg mb-[-4px] z-0 opacity-80 mt-1 border-l-2 border-r-2 ${isMe ? 'border-r bg-primary/10 text-primary border-primary/40 rounded-tr-lg pr-3 pl-2' : 'border-l bg-muted text-muted-foreground border-muted-foreground/40 rounded-tl-lg pl-3 pr-2'}`}
            >
              <div className="font-semibold text-[10px] mb-1">
                Replying to{' '}
                {typeof message.replyTo.sender === 'object' &&
                message.replyTo.sender !== null
                  ? (message.replyTo.sender as Sender).name
                  : 'someone'}
              </div>
              <div className="truncate opacity-75 max-w-[150px]">
                {typeof message.replyTo.content === 'string' &&
                message.replyTo.content === '🚫 This message was deleted.'
                  ? 'Deleted message'
                  : typeof message.replyTo.content === 'string'
                    ? message.replyTo.content
                    : ''}
              </div>
            </div>
          )}

          {/* Message Bubble + Hover Action Controls */}
          <div
            className={`flex items-center gap-1 relative z-10 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* The actual message text bubble */}
            <div
              className={`p-3 rounded-2xl shadow-sm text-sm break-words relative w-full ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm border border-border/40 text-foreground'} ${message.isDeleted ? 'opacity-60 italic' : ''}`}
            >
              {message.content}
            </div>

            {/*
             * Quick Actions dropdown — only visible on hover via opacity transition.
             * The entire dropdown is hidden for deleted messages since no meaningful
             * actions (reply, edit, delete) apply to a tombstone message.
             */}
            {!message.isDeleted && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center shrink-0 px-1 gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 rounded-full hover:bg-muted text-muted-foreground outline-none">
                    <MoreHorizontal size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align={isMe ? 'end' : 'start'}
                    side="top"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    {/* Reply — available to all users on non-deleted messages */}
                    <DropdownMenuItem onClick={() => onReply(message)}>
                      <Reply className="mr-2 h-4 w-4" />
                      <span>Reply</span>
                    </DropdownMenuItem>

                    {/* Edit & Delete — only available to the message author */}
                    {isMe && (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(message)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleDeleteClick}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          disabled={isDeleting}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Footer Info (Timestamp & Edited indicator) */}
          <div className="flex items-center gap-1 mt-1 px-1">
            {message.isEdited && !message.isDeleted && (
              <span className="text-[10px] text-muted-foreground/60">
                (edited)
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/60">
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
