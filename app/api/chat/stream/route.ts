import { chatEmitter } from '@/lib/eventEmitter'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Payload shape emitted by the chat event system and streamed to clients via SSE.
 *
 * The `type` field distinguishes between lifecycle events and mutation events:
 * - `CONNECTED`      – Sent once when the SSE connection is first established.
 * - `HEARTBEAT`      – Sent every 30 seconds to prevent proxy/load-balancer timeouts.
 * - `NEW_MESSAGE`    – A brand-new message was created in the chat.
 * - `UPDATE_MESSAGE` – An existing message's content was edited by its author.
 * - `DELETE_MESSAGE` – A message was soft-deleted (content replaced, isDeleted flag set).
 *
 * `message` carries the fully populated, serialised Mongoose document when the
 * event involves a mutation (NEW_MESSAGE, UPDATE_MESSAGE, DELETE_MESSAGE).
 * It is omitted for lifecycle-only events (CONNECTED, HEARTBEAT).
 *
 * **Type consistency note:** The emitter in `app/api/chat/messages/[id]/route.ts`
 * emits `'UPDATE_MESSAGE'` and the consumer in `hooks/useChatMessages.ts` listens
 * for `'UPDATE_MESSAGE'`. This union must stay in sync with both sides.
 */
interface ChatEventPayload {
  type:
    | 'CONNECTED'
    | 'HEARTBEAT'
    | 'NEW_MESSAGE'
    | 'UPDATE_MESSAGE'
    | 'DELETE_MESSAGE'
  message?: Record<string, unknown>
}

/**
 * Force this route to be dynamically rendered on every request.
 * SSE endpoints must never be statically cached by Next.js.
 */
export const dynamic = 'force-dynamic'

/**
 * GET /api/chat/stream
 *
 * Initialises and manages a Server-Sent Events (SSE) stream for real-time
 * chat updates. Each connected browser client receives a dedicated stream
 * that forwards mutation events (new messages, edits, deletions) as they
 * occur via the in-process `chatEmitter`.
 *
 * **Architecture note:** The current implementation uses a process-local
 * `EventEmitter` (`chatEmitter`) as the broadcast layer. This works
 * correctly when the application runs as a single Node.js process (e.g.,
 * Vercel serverless functions sharing the same runtime, or a single
 * `next start` instance). For multi-instance deployments behind a load
 * balancer, this should be replaced with a shared pub/sub layer such as
 * Redis Pub/Sub, Pusher, or Postgres LISTEN/NOTIFY to ensure events
 * propagate across all server instances.
 *
 * @param req - The incoming NextRequest; its `signal` is used to detect
 *              client disconnection and trigger cleanup.
 * @returns A streaming NextResponse encoded as `text/event-stream`.
 */
export async function GET(req: NextRequest) {
  /*
   * TransformStream provides a ReadableStream/WritableStream pair.
   * The writable side is used internally to push SSE frames; the readable
   * side is returned to the client as the response body.
   */
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  /**
   * Serialises `data` as a JSON-encoded SSE frame (`data: ...\n\n`) and
   * pushes it to the writable side of the transform stream.
   *
   * Write errors (e.g., the client has already disconnected before the
   * abort signal fires) are caught and logged to prevent unhandled
   * rejections from crashing the request handler.
   *
   * @param data - The structured event payload to send to the client.
   */
  const sendEvent = async (data: ChatEventPayload) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
    } catch (writeErr) {
      console.error('SSE write error:', writeErr)
    }
  }

  /**
   * Listener callback wired to the shared `chatEmitter` on the
   * `'chatUpdate'` channel. Forwards every received event (new message,
   * edit, or deletion) directly to this SSE client without filtering.
   *
   * @param data - The chat event payload emitted by a mutation handler.
   */
  const onChatUpdate = (data: ChatEventPayload) => {
    sendEvent(data)
  }

  // Subscribe this client's listener to the shared in-process event bus.
  chatEmitter.on('chatUpdate', onChatUpdate)

  // Immediately send a CONNECTED event so the client knows the stream is live.
  sendEvent({ type: 'CONNECTED' })

  /*
   * Heartbeat interval (30 s) keeps the connection alive through proxies
   * and load balancers that may drop idle connections. The HEARTBEAT event
   * type is ignored by the client-side SSE handler in useChatMessages.
   */
  const heartbeatInterval = setInterval(() => {
    sendEvent({ type: 'HEARTBEAT' })
  }, 30000)

  /*
   * Cleanup handler: when the client disconnects (tab closed, navigation,
   * network loss), the request's AbortSignal fires. We must:
   * 1. Stop the heartbeat timer to prevent memory leaks.
   * 2. Remove the listener from chatEmitter to avoid dangling references.
   * 3. Close the writer to finalise the stream.
   */
  req.signal.addEventListener('abort', () => {
    clearInterval(heartbeatInterval)
    chatEmitter.off('chatUpdate', onChatUpdate)
    try {
      writer.close()
    } catch (_closeErr) {
      /* Writer may already be closed by the runtime; safe to ignore. */
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
