import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import dbConnect from '@/lib/dbConnect'
import Message from '@/model/Message'
import { chatEmitter } from '@/lib/eventEmitter'

import mongoose from 'mongoose'


export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await dbConnect()

    // Fetch latest 100 messages
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Access control: only @iiitl.ac.in emails can send messages
    if (!session.user.email.toLowerCase().endsWith('@iiitl.ac.in')) {
      return NextResponse.json(
        { error: 'Only IIITL students can send messages' },
        { status: 403 }
      )
    }

    const { content, replyTo } = await req.json()

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    if (replyTo && !mongoose.Types.ObjectId.isValid(replyTo)) {
      return NextResponse.json(
        { error: 'Invalid replyTo message ID' },
        { status: 400 }
      )
    }

    await dbConnect()

    const newMessage = await Message.create({
      sender: session.user.id,
      email: session.user.email,
      content: content.trim(),
      replyTo: replyTo || null,
    })

    // Populate sender before returning to immediately show in UI if needed
    await newMessage.populate('sender', 'name image email')
    if (newMessage.replyTo) {
      await newMessage.populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' },
      })
    }

    // Emit event for SSE subscribers
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
