'use client'

import React, { useEffect, useRef } from 'react'
import { MessageCircle, Send, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ChatMessage from '@/components/chat/ChatMessage'
import { useChatMessages } from '@/hooks/useChatMessages'
import { useSession } from 'next-auth/react'

/**
 * Full-page UI rendering component for the IIITL General Chat.
 *
 * This page component serves as a dedicated, immersive chat view that
 * occupies the main content area of the layout. It uses the shared
 * `useChatMessages` hook with `isOpen: true` (always active) to maintain
 * a persistent SSE connection and display real-time message updates.
 *
 * When the user navigates to `/chat`, the `ChatWidget` component in the
 * root layout detects the pathname and returns `null`, ensuring only this
 * component manages the SSE connection and message state — preventing
 * duplicate API calls and unsynchronised message lists.
 *
 * @returns A full-page chat layout with message list, input area, and
 *          contextual reply/edit banners.
 */
export default function ChatPage() {
  const { data: session } = useSession()
  const {
    messages,
    inputText,
    setInputText,
    isLoading,
    error,
    editingMessage,
    replyingTo,
    currentUserId,
    isIIITLUser,
    handleSend,
    handleDeleteMessage,
    startReply,
    startEdit,
    cancelAction,
    inputRef,
  } = useChatMessages({ isOpen: true })

  /** Ref to a sentinel div at the bottom of the message list for auto-scrolling. */
  const messagesEndRef = useRef<HTMLDivElement>(null)

  /**
   * Auto-scroll effect: smoothly scrolls the message list to the bottom
   * whenever new messages arrive. Scroll is suppressed during edit mode
   * to preserve the user's viewport position while they modify a message.
   */
  useEffect(() => {
    if (!editingMessage && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, editingMessage])

  /**
   * Keyboard handler for the chat input: submits the message on Enter
   * (without Shift held) to match standard chat application UX patterns.
   *
   * @param e - The keyboard event from the input element.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col h-[calc(100vh-80px)] max-h-[800px]">
      <div className="bg-card border rounded-2xl shadow-xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <h1 className="font-bold text-2xl">IIITL General Chat</h1>
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Real-time Community
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/10">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-muted-foreground">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageCircle size={40} className="opacity-30" />
              </div>
              <p>No messages yet. Be the first to say hi!</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-2 max-w-4xl mx-auto w-full">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg._id}
                  message={msg}
                  currentUserId={currentUserId}
                  onReply={startReply}
                  onEdit={startEdit}
                  onDelete={handleDeleteMessage}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Auth / Read-only warning */}
        {!isIIITLUser && (
          <div className="bg-destructive/10 text-destructive text-sm font-medium py-3 px-4 text-center border-t border-b">
            Read-only mode. You need an @iiitl.ac.in email to send messages in
            the group chat.
          </div>
        )}

        {/* Input Area */}
        {session && isIIITLUser && (
          <div className="border-t bg-card flex flex-col max-w-4xl mx-auto w-full">
            {/* Status Banner for Replying/Editing */}
            {(replyingTo || editingMessage) && (
              <div className="p-3 bg-primary/10 border-b flex justify-between items-center text-sm px-6">
                {replyingTo && (
                  <span className="font-medium text-primary">
                    Replying to{' '}
                    {typeof replyingTo.sender === 'object' &&
                    replyingTo.sender !== null
                      ? (replyingTo.sender as { name: string }).name
                      : 'someone'}
                  </span>
                )}
                {editingMessage && (
                  <span className="font-medium text-primary">
                    Editing message
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-primary/20"
                  onClick={cancelAction}
                  aria-label={editingMessage ? 'Cancel edit' : 'Cancel reply'}
                >
                  <XCircle size={16} />
                </Button>
              </div>
            )}

            <div className="p-4 md:p-6 flex gap-3 items-center relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={
                  editingMessage
                    ? 'Edit your message...'
                    : 'Type a message to the group...'
                }
                aria-label={
                  editingMessage
                    ? 'Edit your message'
                    : 'Type a message to the group'
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-muted border border-transparent p-4 rounded-full outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-base transition-all"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !inputText.trim()}
                aria-disabled={isLoading || !inputText.trim()}
                aria-label="Send message"
                className="rounded-full h-12 w-12 md:h-14 md:w-14 p-0 flex justify-center items-center shadow-md hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <Send size={22} className={isLoading ? 'opacity-50' : 'ml-1'} />
              </Button>
            </div>
            {error && (
              <div className="px-6 pb-4 text-sm text-destructive text-center font-medium">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
