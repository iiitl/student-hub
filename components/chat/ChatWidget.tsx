'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, Send, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ChatMessage from './ChatMessage'
import { useChatMessages } from '@/hooks/useChatMessages'

/**
 * Floating drawer UI rendering component for global contextual hub chat.
 * Toggled off when viewing the full standalone chat page to prevent redundancy.
 *
 * @returns An attached side-panel layout or null if pathing hides component.
 */
export default function ChatWidget() {
  const pathname = usePathname()

  // Don't render (or poll) on full chat page
  if (pathname === '/chat') return null

  return <ChatWidgetInner />
}

function ChatWidgetInner() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

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

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive if not editing
  useEffect(() => {
    if (!editingMessage && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, editingMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground z-50 transition-transform hover:scale-105"
        >
          <MessageCircle size={28} />
        </Button>
      )}

      {/* Side Panel Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-background border-l shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card text-card-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="font-semibold text-lg">IIITL Group Chat</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </Button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
          {messages.length === 0 ? (
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
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Auth / Read-only warning */}
        {!isIIITLUser && (
          <div className="bg-destructive/10 text-destructive text-xs py-2 px-4 text-center border-t">
            Read-only mode. You need an @iiitl.ac.in email to send messages.
          </div>
        )}

        {/* Input Area */}
        {session && isIIITLUser && (
          <div className="border-t bg-card flex flex-col">
            {/* Status Banner for Replying/Editing */}
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

            <div className="p-4 flex gap-2 items-center relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={
                  editingMessage ? 'Edit your message...' : 'Type a message...'
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
            {error && (
              <div className="px-4 pb-2 text-xs text-destructive text-center">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overlay to close panel when clicking outside on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
