import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import dbConnect from '@/lib/dbConnect'
import Message from '@/model/Message'
import { chatEmitter } from '@/lib/eventEmitter'

import mongoose from 'mongoose'

/**
 * Authorizes and modifies specific content inside an already existing database message artifact.
 *
 * @param req External Request object containing the intended replacement message payload.
 * @param params Destructured route params to acquire the object ID.
 * @returns Success response with updated populated object for frontend handling.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // In Next 15+ we technically should await params if it's dynamic but let's check config, typically Next 14 handles it synchronously but App Router changed params to Promise in Next 15 depending on usage. Actually, Next 15 recommends `await params`. Let's do `const { id } = await params`.
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

    const message = await Message.findById(id)
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Verify ownership
    if (message.sender.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own messages' },
        { status: 403 }
      )
    }

    if (message.isDeleted) {
      return NextResponse.json(
        { error: 'Cannot edit a deleted message' },
        { status: 400 }
      )
    }

    message.content = content.trim()
    message.isEdited = true
    await message.save()

    await message.populate('sender', 'name image email')
    if (message.replyTo) {
      await message.populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' },
      })
    }

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
 * Triggers a soft deletion sequence on the specified Message object within properties, overriding the content payload.
 *
 * @param req NextRequest object payload.
 * @param params Contains the active database-generated ID context string.
 * @returns Server-side confirmation of database alterations mapping success string.
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

    const message = await Message.findById(id)
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Verify ownership or check if admin. But since roles are available on session, we can optionally allow admins.
    // However, specifically the user should be the sender. Let's strictly enforce sender for now.
    if (
      message.sender.toString() !== session.user.id &&
      !session.user.roles?.includes('admin')
    ) {
      return NextResponse.json(
        { error: 'You can only delete your own messages' },
        { status: 403 }
      )
    }

    // Soft delete
    message.content = '🚫 This message was deleted.'
    message.isDeleted = true
    await message.save()

    await message.populate('sender', 'name image email')
    if (message.replyTo) {
      await message.populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' },
      })
    }

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
