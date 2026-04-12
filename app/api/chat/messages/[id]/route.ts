import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import dbConnect from '@/lib/dbConnect'
import Message from '@/model/Message'
import { chatEmitter } from '@/lib/eventEmitter'

import mongoose from 'mongoose'

/**
 * PATCH /api/chat/messages/:id
 *
 * Authorises and modifies the text content of an existing chat message.
 * Only the original author (matched via session user ID) may edit a message,
 * and the message must not have been soft-deleted.
 *
 * **Auth gates:**
 * 1. User must be logged in with a valid `session.user.id`.
 * 2. User's email must belong to the `@iiitl.ac.in` domain.
 * 3. `session.user.id` must match the message's `sender` field (ownership).
 *
 * **Request body:**
 * - `content` (string, required) — The replacement text for the message.
 *
 * **Side effect:** On success, an `UPDATE_MESSAGE` event is emitted on the
 * shared `chatEmitter` to push the edit to all connected SSE clients.
 *
 * @param req    - The incoming Request containing `{ content }` JSON.
 * @param params - Next.js dynamic route params (Promise-based in App Router).
 * @returns A `NextResponse` with the fully populated updated message (200),
 *          or an appropriate error response (400/401/403/404/500).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    /* ── Auth gate: must be logged in with a valid user ID ── */
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    /* ── Domain gate: only @iiitl.ac.in emails may write (edit/delete) ── */
    if (!session.user.email?.toLowerCase().endsWith('@iiitl.ac.in')) {
      return NextResponse.json(
        { error: 'Read-only: write access restricted to @iiitl.ac.in' },
        { status: 403 }
      )
    }

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid message ID' }, { status: 400 })
    }
    const { content } = await req.json()

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    await dbConnect()

    /* ── Fetch the target message from the database ── */
    const message = await Message.findById(id)
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    /* ── Ownership gate: only the original author may edit ── */
    if (message.sender.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own messages' },
        { status: 403 }
      )
    }

    /* ── Deleted messages are tombstones and cannot be resurrected ── */
    if (message.isDeleted) {
      return NextResponse.json(
        { error: 'Cannot edit a deleted message' },
        { status: 400 }
      )
    }

    /* ── Apply the content update and mark as edited ── */
    message.content = content.trim()
    message.isEdited = true
    await message.save()

    /*
     * Re-populate sender and replyTo so the emitted SSE payload and the
     * HTTP response both contain display-ready data.
     */
    await message.populate('sender', 'name image email')
    if (message.replyTo) {
      await message.populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' },
      })
    }

    /* Broadcast UPDATE_MESSAGE to all SSE clients via the shared emitter. */
    chatEmitter.emit('chatUpdate', {
      type: 'UPDATE_MESSAGE',
      message: message,
    })

    return NextResponse.json(message, { status: 200 })
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/chat/messages/:id
 *
 * Performs a soft delete on the specified message. The message content
 * is replaced with a tombstone string (`🚫 This message was deleted.`)
 * and the `isDeleted` flag is set to `true`. The document is **not**
 * removed from the database so that reply chains referencing it
 * continue to render correctly (showing "Deleted message" inline).
 *
 * **Auth gates:**
 * 1. User must be logged in with a valid `session.user.id`.
 * 2. User's email must belong to the `@iiitl.ac.in` domain.
 * 3. User must be the original sender **or** have the `admin` role.
 *
 * **Side effect:** On success, a `DELETE_MESSAGE` event is emitted on
 * the shared `chatEmitter` to push the deletion to all SSE clients.
 *
 * @param req    - The incoming Request (body is not used).
 * @param params - Next.js dynamic route params providing the message ID.
 * @returns A `NextResponse` with `{ success: true }` (200), or an
 *          appropriate error response (400/401/403/404/500).
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    /* ── Auth gate: must be logged in with a valid user ID ── */
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    /* ── Domain gate: only @iiitl.ac.in emails may write (edit/delete) ── */
    if (!session.user.email?.toLowerCase().endsWith('@iiitl.ac.in')) {
      return NextResponse.json(
        { error: 'Read-only: write access restricted to @iiitl.ac.in' },
        { status: 403 }
      )
    }

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid message ID' }, { status: 400 })
    }

    await dbConnect()

    /* ── Fetch the target message from the database ── */
    const message = await Message.findById(id)
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    /*
     * Ownership / admin gate: the user must either be the original sender
     * or hold the 'admin' role. This allows moderators to clean up
     * inappropriate content while normal users can only delete their own.
     */
    if (
      message.sender.toString() !== session.user.id &&
      !session.user.roles?.includes('admin')
    ) {
      return NextResponse.json(
        { error: 'You can only delete your own messages' },
        { status: 403 }
      )
    }

    /*
     * Soft delete: replace the content with a tombstone indicator and set
     * the isDeleted flag. The document stays in the database so reply
     * chains can still reference it (displaying "Deleted message").
     */
    message.content = '🚫 This message was deleted.'
    message.isDeleted = true
    await message.save()

    /*
     * Re-populate sender and replyTo so the emitted SSE payload
     * contains display-ready data for connected clients.
     */
    await message.populate('sender', 'name image email')
    if (message.replyTo) {
      await message.populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' },
      })
    }

    /* Broadcast DELETE_MESSAGE to all SSE clients via the shared emitter. */
    chatEmitter.emit('chatUpdate', {
      type: 'DELETE_MESSAGE',
      message: message,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
