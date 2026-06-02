import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { MessageData } from '@/components/chat/ChatMessage'

/**
 * Configuration options for the {@link useChatMessages} hook.
 *
 * @property isOpen - When `true`, the hook will establish an SSE connection
 *                    and perform the initial message fetch. When `false`,
 *                    the SSE connection is torn down and no network requests
 *                    are made. Defaults to `true` if omitted.
 */
interface UseChatMessagesOptions {
  isOpen?: boolean
}

/**
 * Custom React hook to manage real-time group chat messages and UI state.
 *
 * **Architecture overview:**
 * - On mount (when `isOpen` is `true`), performs a one-time `GET` request to
 *   `/api/chat/messages` to seed the local message list.
 * - Opens an SSE connection to `/api/chat/stream` to receive push events
 *   for new messages, edits (UPDATE_MESSAGE), and deletions (DELETE_MESSAGE).
 * - The SSE connection lifecycle is tied **only** to `isOpen` — changes to
 *   `replyingTo` or `editingMessage` do **not** recreate the EventSource,
 *   which avoids missed events during teardown/reconnect gaps.
 * - Mutable state that event handlers need (e.g., current messages,
 *   replyingTo, editingMessage) is tracked via `useRef`s so the SSE
 *   `onmessage` handler can read the latest values without re-binding.
 *
 * **Returned API:**
 * - `messages` / `inputText` / `isLoading` / `error` — React state for rendering.
 * - `editingMessage` / `replyingTo` — Active UI mode (edit vs. reply vs. normal).
 * - `handleSend` — Sends a new message, edits an existing one, or replies.
 * - `handleDeleteMessage` — Soft-deletes a message by ID.
 * - `startReply` / `startEdit` / `cancelAction` — Toggle UI modes.
 * - `inputRef` — A ref to the text input element for programmatic focus.
 * - `currentUserId` / `isIIITLUser` — Session-derived identity helpers.
 *
 * @param options - See {@link UseChatMessagesOptions}.
 * @returns An object containing chat state, derived values, and handler functions.
 */
export function useChatMessages(options: UseChatMessagesOptions = {}) {
  /** Next-Auth session; provides user identity and email for domain checks. */
  const { data: session } = useSession()

  /** Controls whether network activity (fetch + SSE) is active. */
  const { isOpen = true } = options

  /** The ordered list of chat messages displayed in the UI. */
  const [messages, setMessages] = useState<MessageData[]>([])

  /** Controlled value for the chat text input field. */
  const [inputText, setInputText] = useState('')

  /** True while an async send/edit/delete operation is in-flight. */
  const [isLoading, setIsLoading] = useState(false)

  /** User-facing error string displayed below the input; cleared on next send. */
  const [error, setError] = useState('')

  /**
   * When non-null, the UI is in "edit" mode — the input is pre-filled with
   * this message's content and pressing Send will issue a PATCH instead of POST.
   */
  const [editingMessage, setEditingMessage] = useState<MessageData | null>(null)

  /**
   * When non-null, the UI is in "reply" mode — a reply banner is shown above
   * the input and pressing Send will attach this message's ID as `replyTo`.
   */
  const [replyingTo, setReplyingTo] = useState<MessageData | null>(null)

  /** Ref to the text <input> element; used for programmatic `.focus()` calls. */
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Whether the authenticated user's email ends with `@iiitl.ac.in`.
   * Only IIITL domain users can send messages; others see a read-only view.
   */
  const isIIITLUser = session?.user?.email
    ?.toLowerCase()
    ?.endsWith('@iiitl.ac.in')

  /** The authenticated user's MongoDB ObjectId (from session). */
  const currentUserId = session?.user?.id

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Refs for mutable state accessed inside the SSE onmessage handler.
   *
   * The SSE useEffect depends only on [isOpen] to avoid tearing down and
   * recreating the EventSource when transient UI state (e.g., replyingTo)
   * changes. However, the onmessage handler sometimes needs the *latest*
   * value of these states (e.g., to cancel a reply if the target message
   * is deleted remotely). Using refs lets us read current values without
   * adding them to the effect's dependency array.
   * ──────────────────────────────────────────────────────────────────────────
   */

  /** Ref mirror of `messages` for access inside the SSE handler. */
  const messagesRef = useRef(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  /** Ref mirror of `replyingTo` for access inside the SSE handler. */
  const replyingToRef = useRef(replyingTo)
  useEffect(() => {
    replyingToRef.current = replyingTo
  }, [replyingTo])

  /** Ref mirror of `editingMessage` for access inside the SSE handler. */
  const editingMessageRef = useRef(editingMessage)
  useEffect(() => {
    editingMessageRef.current = editingMessage
  }, [editingMessage])

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Initial fetch effect.
   *
   * Performs a one-time GET to /api/chat/messages when the chat becomes
   * open to seed the message list. This ensures the user sees existing
   * history immediately, before the SSE connection starts delivering
   * incremental updates.
   * ──────────────────────────────────────────────────────────────────────────
   */
  useEffect(() => {
    if (!isOpen) return

    /**
     * Fetches the latest 100 messages from the REST endpoint and replaces
     * the local message state. Errors are logged but do not surface to the
     * user — the SSE connection will deliver updates regardless.
     */
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

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * SSE connection effect — real-time updates.
   *
   * Opens an EventSource to /api/chat/stream and processes three event types:
   *   - NEW_MESSAGE    → Appends to the message list (with dedup guard).
   *   - UPDATE_MESSAGE → Replaces the matching message in-place; also updates
   *                       any nested replyTo references that point to the
   *                       modified message.
   *   - DELETE_MESSAGE → Same replacement logic as UPDATE_MESSAGE, plus
   *                       cancels any active reply/edit targeting the deleted
   *                       message to prevent the user from replying to or
   *                       editing a tombstone.
   *
   * The dependency array intentionally contains only [isOpen]. Transient state
   * (messages, replyingTo, editingMessage) is read via refs so the EventSource
   * is never torn down unnecessarily — which would cause missed events during
   * the reconnect window.
   *
   * Browser-native EventSource auto-reconnects on network drops. The
   * `onerror` handler intentionally suppresses console output to avoid
   * noisy Next.js dev overlay popups during normal reconnections.
   * ──────────────────────────────────────────────────────────────────────────
   */
  useEffect(() => {
    if (!isOpen) return

    const eventSource = new EventSource('/api/chat/stream')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'NEW_MESSAGE') {
          setMessages((prev) => {
            // Dedup guard: prevent double-insertion if the POST response
            // already added this message to state before the SSE event arrived.
            if (prev.some((m) => m._id === data.message._id)) return prev
            return [...prev, data.message]
          })
        } else if (
          data.type === 'UPDATE_MESSAGE' ||
          data.type === 'DELETE_MESSAGE'
        ) {
          setMessages((prev) =>
            prev.map((msg) => {
              // Replace the target message with the updated document.
              let updatedMsg = msg._id === data.message._id ? data.message : msg

              /*
               * Also patch any nested replyTo reference that points to
               * the modified/deleted message. This ensures reply preview
               * snippets stay in sync without a full re-fetch.
               */
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

          /*
           * When a message is deleted (by any user), cancel the local
           * reply or edit mode if it targets that message. This prevents
           * the user from submitting a reply to a tombstone or editing
           * content that no longer exists.
           */
          if (data.type === 'DELETE_MESSAGE') {
            if (replyingToRef.current?._id === data.message._id) {
              setReplyingTo(null)
            }
            if (editingMessageRef.current?._id === data.message._id) {
              setEditingMessage(null)
              setInputText('')
            }
          }
        }
      } catch (e) {
        console.error('Error parsing SSE message', e)
      }
    }

    eventSource.onerror = () => {
      /*
       * Browsers automatically reconnect when SSE connections drop.
       * Suppressing console.error here to avoid Next.js dev overlays
       * firing on every transient network hiccup.
       */
    }

    /* Cleanup: close the EventSource when the chat is closed or unmounted. */
    return () => {
      eventSource.close()
    }
  }, [isOpen]) // Only re-create SSE when open/close changes; refs handle mutable state

  /**
   * Handles sending a new message, editing an existing one, or replying.
   *
   * Behaviour depends on the current UI mode:
   * - **Edit mode** (`editingMessage` is set): Issues a `PATCH` request to
   *   `/api/chat/messages/:id` with the updated content.
   * - **Reply mode** (`replyingTo` is set): Issues a `POST` request with
   *   `{ content, replyTo: replyingTo._id }`.
   * - **Normal mode**: Issues a plain `POST` with `{ content }`.
   *
   * After a successful mutation, the input is cleared and the active mode
   * (edit/reply) is reset. The message list is **not** manually re-fetched;
   * the SSE stream will deliver the update event, which triggers a state update.
   *
   * Errors are caught and displayed via the `error` state string.
   */
  const handleSend = async () => {
    if (!inputText.trim()) return

    setIsLoading(true)
    setError('')

    try {
      if (editingMessage) {
        // ── Edit flow: PATCH the existing message with new content ──
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
        // ── Send / Reply flow: POST a new message, optionally with replyTo ──
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
      // Re-focus the input after the operation completes (slight delay for
      // React re-render to settle).
      setTimeout(() => {
        inputRef.current?.focus()
      }, 10)
    }
  }

  /**
   * Triggers a soft delete for a specified message ID by issuing a
   * `DELETE` request to `/api/chat/messages/:id`.
   *
   * If the deleted message was being edited or replied to locally,
   * the corresponding mode is cancelled to prevent stale UI state.
   *
   * @param id - The MongoDB ObjectId string of the message to delete.
   */
  const handleDeleteMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Request failed')
      }

      // Cancel local edit/reply modes if they target the deleted message.
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

  /**
   * Prepares the UI for a reply action targeting a specific message.
   *
   * Cancels any active edit mode, sets the reply target, clears the input,
   * and focuses the text field so the user can immediately start typing.
   *
   * @param msg - The message data object to reply to.
   */
  const startReply = useCallback((msg: MessageData) => {
    setEditingMessage(null)
    setReplyingTo(msg)
    setInputText('')
    setTimeout(() => inputRef.current?.focus(), 10)
  }, [])

  /**
   * Places the UI into edit mode for the given message.
   *
   * Populates the input field with the message's current content and
   * positions the cursor at the end of the text for convenient editing.
   * Deleted messages cannot be edited and are silently ignored.
   *
   * @param msg - The message data object to edit.
   */
  const startEdit = useCallback((msg: MessageData) => {
    if (msg.isDeleted) return
    setReplyingTo(null)
    setEditingMessage(msg)
    setInputText(msg.content)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        // Place cursor at end of text for natural editing experience.
        inputRef.current.setSelectionRange(
          msg.content.length,
          msg.content.length
        )
      }
    }, 10)
  }, [])

  /**
   * Aborts all active edit/reply sessions and resets input to its default state.
   * Re-focuses the input field for a seamless transition back to normal mode.
   */
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

