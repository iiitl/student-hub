import { chatEmitter } from '@/lib/eventEmitter'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Payload shape emitted by the chat event system.
 * `type` distinguishes between lifecycle events (CONNECTED, HEARTBEAT)
 * and mutation events (NEW_MESSAGE, EDIT_MESSAGE, DELETE_MESSAGE).
 * `message` carries the serialised document when applicable.
 */
interface ChatEventPayload {
  type: 'CONNECTED' | 'HEARTBEAT' | 'NEW_MESSAGE' | 'EDIT_MESSAGE' | 'DELETE_MESSAGE'
  message?: Record<string, unknown>
}

export const dynamic = 'force-dynamic'

/**
 * Initializes and manages a Server-Sent Events (SSE) stream for real-time chat updates.
 * Pushes events downstream to connected browser clients upon new messages, edits, or deletions.
 *
 * @param req The incoming NextRequest interface.
 * @returns A streaming NextResponse encoded as text/event-stream.
 */
export async function GET(req: NextRequest) {
  // Use a TransformStream to create a readable stream for SSE
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  /**
   * Serialises `data` as a JSON SSE frame and pushes it to the writable stream.
   * Catches write errors (e.g. client already disconnected) to avoid crashing the handler.
   */
  const sendEvent = async (data: ChatEventPayload) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
    } catch (writeErr) {
      console.error('SSE write error:', writeErr)
    }
  }

  /**
   * Listener callback wired to the shared chatEmitter.
   * Forwards every chatUpdate event directly to the SSE client.
   */
  const onChatUpdate = (data: ChatEventPayload) => {
    sendEvent(data)
  }

  // Attach listener to the event emitter
  chatEmitter.on('chatUpdate', onChatUpdate)

  // Send an initial heartbeat/connection event to keep connection alive
  sendEvent({ type: 'CONNECTED' })

  // Keep-alive heartbeat interval to avoid timeout drop
  const heartbeatInterval = setInterval(() => {
    sendEvent({ type: 'HEARTBEAT' })
  }, 30000)

  // Handle client disconnects to clean up resources
  req.signal.addEventListener('abort', () => {
    clearInterval(heartbeatInterval)
    chatEmitter.off('chatUpdate', onChatUpdate)
    try {
      writer.close()
    } catch (_closeErr) {
      /* Writer may already be closed; safe to ignore. */
    }
  })

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
