'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, Send, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ChatMessage from './ChatMessage'
import { useChatMessages } from '@/hooks/useChatMessages'

/**
 * Floating drawer UI rendering component for the global IIITL hub chat.
 *
 * This component is mounted in the root layout (`app/layout.jsx`) and is
 * therefore present on every page. To avoid duplicate API polling when the
 * user navigates to the full-page chat (`/chat`), this wrapper checks the
 * current route via `usePathname()` and returns `null` when `pathname`
 * equals `'/chat'`. This ensures only `ChatPage` polls and renders on
 * that route, preventing duplicated SSE connections and unsynchronised state.
 *
 * When visible, it renders `ChatWidgetInner` which provides the actual
 * chat drawer UI with message display, input, and real-time updates.
 *
 * @returns The chat widget drawer, or `null` when on the `/chat` route.
 */
export default function ChatWidget() {
  /** Current Next.js route path — used to conditionally hide the widget. */
  const pathname = usePathname()

  // Don't render (or poll / open SSE) on the dedicated full-page chat route.
  if (pathname === '/chat') return null

  return <ChatWidgetInner />
}

/**
 * Inner implementation of the floating chat widget drawer.
 *
 * Separated from the outer `ChatWidget` so that the route check (`usePathname`)
 * can short-circuit rendering before any hooks or effects execute, avoiding
 * unnecessary SSE connections and API calls on the `/chat` page.
 *
 * **Features:**
 * - Floating Action Button (FAB) to toggle the drawer open/closed.
 * - Full-height side panel displaying message history, input area, and
 *   status banners for reply/edit modes.
 * - Mobile overlay backdrop to allow closing by tapping outside.
 * - Read-only mode for non-IIITL users (no input area shown).
 * - Auto-scroll to the latest message unless the user is in edit mode.
 *
 * @returns The complete chat drawer UI as a React element.
 */
function ChatWidgetInner() {
  /** Session data from NextAuth; used to determine authentication status. */
  const { data: session } = useSession()

  /** Controls the open/closed state of the side-panel drawer. */
  const [isOpen, setIsOpen] = useState(false)

  /*
   * Destructure all chat state and handlers from the shared hook.
   * The `isOpen` flag is passed so the hook only activates SSE and
   * fetching when the drawer is actually visible.
   */
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
  } = useChatMessages({ isOpen })

  /** Ref to a sentinel div at the bottom of the message list for auto-scrolling. */
  const messagesEndRef = useRef<HTMLDivElement>(null)

  /**
   * Auto-scroll effect: smoothly scrolls to the bottom of the message list
   * when new messages arrive. Scroll is suppressed during edit mode so the
   * user's viewport position is preserved while they modify a message.
   */
  useEffect(() => {
    if (!editingMessage && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, editingMessage])

  /**
   * Keyboard handler for the chat input field. Submits the message on
   * Enter (without Shift) to mirror standard chat application behaviour.
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
    <>
      {/* Floating Action Button — only visible when the drawer is closed */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground z-50 transition-transform hover:scale-105"
        >
          <MessageCircle size={28} />
        </Button>
      )}

      {/* Side Panel Drawer — slides in from the right edge */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-background border-l shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header bar with live indicator and close button */}
        <div className="flex items-center justify-between p-4 border-b bg-card text-card-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="font-semibold text-lg">IIITL Group Chat</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </Button>
        </div>

        {/* Message Area — scrollable container for the message history */}
        <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
          {messages.length === 0 ? (
            /* Empty state placeholder shown when no messages exist yet */
            <div className="h-full flex flex-col justify-center items-center text-muted-foreground">
              <p>No messages yet. Be the first to say hi!</p>
            </div>
          ) : (
            <div className="flex flex-col">
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
              {/* Scroll sentinel — scrollIntoView targets this element */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Auth / Read-only warning — shown for non-IIITL domain users */}
        {!isIIITLUser && (
          <div className="bg-destructive/10 text-destructive text-xs py-2 px-4 text-center border-t">
            Read-only mode. You need an @iiitl.ac.in email to send messages.
          </div>
        )}

        {/* Input Area — only rendered for authenticated IIITL domain users */}
        {session && isIIITLUser && (
          <div className="border-t bg-card flex flex-col">
            {/* Status Banner for Replying/Editing — contextual indicator */}
            {(replyingTo || editingMessage) && (
              <div className="p-2 bg-primary/10 border-b flex justify-between items-center text-xs px-4">
                {replyingTo && (
                  <span className="font-semibold text-primary">
                    Replying to{' '}
                    {typeof replyingTo.sender === 'object' &&
                    replyingTo.sender !== null
                      ? (replyingTo.sender as { name: string }).name
                      : 'someone'}
                  </span>
                )}
                {editingMessage && (
                  <span className="font-semibold text-primary">
                    Editing message
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 rounded-full"
                  onClick={cancelAction}
                >
                  <XCircle size={14} />
                </Button>
              </div>
            )}

            {/* Text input + Send button row */}
            <div className="p-4 flex gap-2 items-center relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={
                  editingMessage ? 'Edit your message...' : 'Type a message...'
                }
                aria-label={
                  editingMessage ? 'Edit your message' : 'Type a message'
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-muted border-none p-3 rounded-full outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !inputText.trim()}
                className="rounded-full h-10 w-10 p-0 flex justify-center items-center"
              >
                <Send size={18} className={isLoading ? 'opacity-50' : ''} />
              </Button>
            </div>
            {/* Error message — displayed below the input on send failures */}
            {error && (
              <div className="px-4 pb-2 text-xs text-destructive text-center">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile overlay backdrop — tapping outside the drawer closes it */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

