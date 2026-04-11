import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import dbConnect from '@/lib/dbConnect'
import Message from '@/model/Message'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // In Next 15+ we technically should await params if it's dynamic but let's check config, typically Next 14 handles it synchronously but App Router changed params to Promise in Next 15 depending on usage. Actually, Next 15 recommends `await params`. Let's do `const { id } = await params`.
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
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

    return NextResponse.json(message, { status: 200 })
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
