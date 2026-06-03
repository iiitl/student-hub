import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import dbConnect from '@/lib/dbConnect'
import Message from '@/model/Message'
import { chatEmitter } from '@/lib/eventEmitter'

import mongoose from 'mongoose'

/**
 * Force this route to be dynamically rendered on every request.
 * Chat message endpoints must never serve stale cached data.
 */
export const dynamic = 'force-dynamic'

/**
 * GET /api/chat/messages
 *
 * Retrieves the latest 100 chat messages from the database, sorted in
 * chronological order (oldest first). Each message's `sender` field is
 * populated with the user's `name`, `image`, and `email`. For reply
 * chains, the `replyTo` field is also populated recursively to include
 * the referenced message and its sender's `name`.
 *
 * This endpoint is publicly accessible (no auth required) so that
 * unauthenticated or non-IIITL users can still view the chat in
 * read-only mode.
 *
 * @returns A `NextResponse` containing a JSON array of `Message` documents
 *          ordered chronologically (oldest → newest), or a 500 error on failure.
 */
export async function GET() {
  try {
    await dbConnect()

    /*
     * Fetch latest 100 messages in descending timestamp order, then
     * reverse the result to present oldest-first (natural chat order).
     * Populate sender fields for display and replyTo for thread context.
     */
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('sender', 'name image email') // Populate sender with limited fields
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' }, // Populate the sender of the replied message
      })
      .exec()

    // Return messages in chronological order (oldest first)
    return NextResponse.json(messages.reverse(), { status: 200 })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/chat/messages
 *
 * Validates, authorizes, and persists a brand-new chat message in the
 * database. Only authenticated users with an `@iiitl.ac.in` email domain
 * are permitted to send messages; all others receive a 403 response.
 *
 * **Request body:**
 * - `content` (string, required) — The text body of the message.
 * - `replyTo` (string, optional) — A valid MongoDB ObjectId referencing
 *   the parent message when this message is a reply.
 *
 * **Side effect:** On successful creation, a `NEW_MESSAGE` event is
 * emitted on the shared `chatEmitter` so that all connected SSE clients
 * receive the new message in real time without requiring a page refresh.
 *
 * @param req - The incoming Request containing the JSON payload.
 * @returns A `NextResponse` with the created (and populated) message
 *          document (status 201), or an appropriate error response.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    /* ── Auth gate: require both email (for domain check) and id (for sender reference) ── */
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    /* ── Domain gate: only @iiitl.ac.in emails can send messages ── */
    if (!session.user.email.toLowerCase().endsWith('@iiitl.ac.in')) {
      return NextResponse.json(
        { error: 'Only IIITL students can send messages' },
        { status: 403 }
      )
    }

    const { content, replyTo } = await req.json()

    /* ── Input validation: content must be a non-empty trimmed string ── */
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    /*
     * Validate replyTo if provided — must be a valid ObjectId to prevent
     * injection of malformed references that would cause Mongoose cast errors.
     */
    if (replyTo && !mongoose.Types.ObjectId.isValid(replyTo)) {
      return NextResponse.json(
        { error: 'Invalid replyTo message ID' },
        { status: 400 }
      )
    }

    await dbConnect()

    /* ── Create the new message document with the authenticated sender ── */
    const newMessage = await Message.create({
      sender: session.user.id,
      email: session.user.email,
      content: content.trim(),
      replyTo: replyTo || null,
    })

    /*
     * Populate sender and replyTo fields before returning so the response
     * is immediately usable by the client without a second fetch.
     */
    await newMessage.populate('sender', 'name image email')
    if (newMessage.replyTo) {
      await newMessage.populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' },
      })
    }

    /*
     * Emit a NEW_MESSAGE event to notify all SSE subscribers in real time.
     * The SSE stream handler in /api/chat/stream forwards this to browser clients.
     */
    chatEmitter.emit('chatUpdate', {
      type: 'NEW_MESSAGE',
      message: newMessage,
    })

    return NextResponse.json(newMessage, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
