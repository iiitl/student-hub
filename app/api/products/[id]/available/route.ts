import dbConnect from '@/lib/dbConnect'
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Product from '@/model/Product'
import { verifyJwt } from '@/lib/auth-utils'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * PATCH /api/products/:id/available
 * Mark a product as available again. Only seller can do this.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
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

    const product = await Product.findById(id)
    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

    // Verify ownership — only the seller can mark as available
    if (product.seller.toString() !== userId) {
      return NextResponse.json(
        { message: 'Forbidden — you can only update your own listings' },
        { status: 403 }
      )
    }

    if (!product.is_sold) {
      return NextResponse.json(
        { message: 'Product is already available' },
        { status: 400 }
      )
    }

    product.is_sold = false
    product.show_when_sold = false
    if (product.quantity <= 0) {
      product.quantity = 1
    }

    await product.save()

    return NextResponse.json(
      { message: 'Product is available again', product },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('PATCH /api/products/[id]/available error:', error)
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    )
  }
}
