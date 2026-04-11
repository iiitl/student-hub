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
 */
export interface Sender {
  _id: string
  name: string
  image?: string
  email: string
}

/**
 * Represents a single broadcasted chat message object.
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

interface ChatMessageProps {
  message: MessageData
  currentUserId: string | undefined
  onReply: (message: MessageData) => void
  onEdit: (message: MessageData) => void
  onDelete: (messageId: string) => void
}

/**
 * Renders a single localized message bubble alongside contextual actions.
 * Supports delete, edit, and reply context overlays.
 *
 * @param message The populated message object.
 * @param currentUserId The active user ID for ownership validation.
 * @param onReply Callback handler to trigger replying state.
 * @param onEdit Callback handler to trigger edit state.
 * @param onDelete Callback handler executing the soft delete mutation.
 * @returns React functional component node.
 */
export default function ChatMessage({
  message,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
}: ChatMessageProps) {
  const sender = typeof message.sender === 'object' ? message.sender as Sender : null
  const isMe = sender?._id === currentUserId
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(message._id)
      setShowDeleteModal(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Check if valid date
      if (isNaN(date.getTime())) return ''
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <>
      {/* Delete Confirmation Modal */}
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

      <div
        className={`flex w-full mb-4 group ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}
      >
        {/* Avatar */}
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
          {/* Name label (only for others) */}
          {!isMe && (
            <span className="text-xs text-muted-foreground ml-1 mb-1 font-medium">
              {sender?.name}
            </span>
          )}

          {/* Reply Context */}
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

          {/* Message Bubble + Actions */}
          <div
            className={`flex items-center gap-1 relative z-10 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`p-3 rounded-2xl shadow-sm text-sm break-words relative w-full ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm border border-border/40 text-foreground'} ${message.isDeleted ? 'opacity-60 italic' : ''}`}
            >
              {message.content}
            </div>

            {/* Quick Actions (only visible on hover) */}
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
                  <DropdownMenuItem onClick={() => onReply(message)}>
                    <Reply className="mr-2 h-4 w-4" />
                    <span>Reply</span>
                  </DropdownMenuItem>

                  {isMe && !message.isDeleted && (
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
