import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { MessageData } from '@/components/chat/ChatMessage'

export function useChatMessages(options: { isOpen?: boolean } = {}) {
  const { data: session } = useSession()
  const { isOpen = true } = options
  const [messages, setMessages] = useState<MessageData[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [editingMessage, setEditingMessage] = useState<MessageData | null>(null)
  const [replyingTo, setReplyingTo] = useState<MessageData | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const isIIITLUser = session?.user?.email?.toLowerCase()?.endsWith('@iiitl.ac.in')
  const currentUserId = session?.user?.id

  // Use refs to track latest state for event listeners without re-binding
  const messagesRef = useRef(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Initial fetch
  useEffect(() => {
    if (!isOpen) return
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/chat/messages')
        if (res.ok) {
          const data = await res.json()
          setMessages(data)
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err)
      }
    }
    fetchMessages()
  }, [isOpen])

  // SSE connection for real-time updates
  useEffect(() => {
    if (!isOpen) return

    const eventSource = new EventSource('/api/chat/stream')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'NEW_MESSAGE') {
          setMessages((prev) => {
            // Prevent duplicate insertion
            if (prev.some((m) => m._id === data.message._id)) return prev
            return [...prev, data.message]
          })
        } else if (data.type === 'UPDATE_MESSAGE' || data.type === 'DELETE_MESSAGE') {
          setMessages((prev) =>
            prev.map((msg) => {
              let updatedMsg = msg._id === data.message._id ? data.message : msg

              // Also upate any nested replyTo content if the parent was updated/deleted
              if (
                updatedMsg.replyTo &&
                typeof updatedMsg.replyTo === 'object' &&
                updatedMsg.replyTo._id === data.message._id
              ) {
                updatedMsg = {
                  ...updatedMsg,
                  replyTo: {
                    ...updatedMsg.replyTo,
                    content: data.message.content,
                    isDeleted: data.message.isDeleted,
                  },
                }
              }
              return updatedMsg
            })
          )
          
          // Cancel reply if the target message was deleted
          if (data.type === 'DELETE_MESSAGE' && replyingTo?._id === data.message._id) {
            setReplyingTo(null)
          }
        }
      } catch (e) {
        console.error('Error parsing SSE message', e)
      }
    }

    eventSource.onerror = (err) => {
      // Browsers automatically reconnect when SSE connections drop.
      // Suppressing console.error here to avoid Next.js dev overylays.
      // console.debug('SSE reconnecting...', err)
    }

    return () => {
      eventSource.close()
    }
  }, [isOpen, replyingTo]) // Include replyingTo so we can clear it if deleted

  const handleSend = async () => {
    if (!inputText.trim()) return

    setIsLoading(true)
    setError('')

    try {
      if (editingMessage) {
        // Edit flow
        const res = await fetch(`/api/chat/messages/${editingMessage._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: inputText }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Request failed')
        }
        setEditingMessage(null)
      } else {
        // Send / Reply flow
        const payload = replyingTo
          ? { content: inputText, replyTo: replyingTo._id }
          : { content: inputText }

        const res = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Request failed')
        }
        setReplyingTo(null)
      }

      setInputText('')
      // Note: We don't need to manually fetch messages anymore, SSE updates it.
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to send message')
      } else {
        setError('Failed to send message')
      }
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 10)
    }
  }

  const handleDeleteMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Request failed')
      }
      
      if (editingMessage?._id === id) {
        cancelAction()
      }
      if (replyingTo?._id === id) {
        setReplyingTo(null)
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message)
      } else {
        alert('An error occurred')
      }
    }
  }

  const startReply = useCallback((msg: MessageData) => {
    setEditingMessage(null)
    setReplyingTo(msg)
    setInputText('')
    setTimeout(() => inputRef.current?.focus(), 10)
  }, [])

  const startEdit = useCallback((msg: MessageData) => {
    if (msg.isDeleted) return
    setReplyingTo(null)
    setEditingMessage(msg)
    setInputText(msg.content)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.setSelectionRange(msg.content.length, msg.content.length)
      }
    }, 10)
  }, [])

  const cancelAction = useCallback(() => {
    setReplyingTo(null)
    setEditingMessage(null)
    setInputText('')
    setTimeout(() => inputRef.current?.focus(), 10)
  }, [])

  return {
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
  }
}
