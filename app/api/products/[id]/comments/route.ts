import dbConnect from '@/lib/dbConnect'
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Product, { IComment } from '@/model/Product'
import User from '@/model/User'
import { verifyJwt } from '@/lib/auth-utils'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/products/:id/comments
 * Add a new comment or reply to an existing comment.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    await dbConnect()

    const { id } = await context.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid product ID' },
        { status: 400 }
      )
    }

    // Authenticate the user
    const authResponse = await verifyJwt(req)
    if (authResponse.status !== 200) {
      return authResponse
    }

    const authData = await authResponse.json()
    const userId = authData.userId as string

    const body = await req.json()
    const { text, offerPrice, parentCommentId } = body

    if (!text || !String(text).trim()) {
      return NextResponse.json(
        { message: 'Comment text is required' },
        { status: 400 }
      )
    }

    const product = await Product.findById(id)
    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

    if (!product.comments) {
      product.comments = []
    }

    const newReply = {
      user: new mongoose.Types.ObjectId(userId),
      text: String(text).trim().substring(0, 500),
      createdAt: new Date(),
    }

    if (parentCommentId) {
      // It's a reply
      if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
        return NextResponse.json(
          { message: 'Invalid parent comment ID' },
          { status: 400 }
        )
      }

      const parentComment = product.comments.find((c: any) => c._id && c._id.toString() === parentCommentId) as any
      if (!parentComment) {
        return NextResponse.json(
          { message: 'Parent comment not found' },
          { status: 404 }
        )
      }

      parentComment.replies.push(newReply)
    } else {
      // Top level comment
      const newComment = {
        user: new mongoose.Types.ObjectId(userId),
        text: String(text).trim().substring(0, 1000),
        offerPrice: (offerPrice !== undefined && offerPrice !== null && offerPrice !== '') ? Number(offerPrice) : undefined,
        createdAt: new Date(),
        replies: [],
      }
      product.comments.push(newComment as any)
    }

    await product.save()

    // We want the populated user info back, so we populate the newly added part, or just fetch the whole product populated
    const populatedProduct = await Product.findById(product._id)
      .populate('seller', 'name email image')
      .populate({ path: 'comments.user', select: 'name email image' })
      .populate({ path: 'comments.replies.user', select: 'name email image' })
      .lean()

    return NextResponse.json(
      { message: 'Comment added successfully', product: populatedProduct },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('POST /api/products/[id]/comments error:', error)
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    )
  }
}
