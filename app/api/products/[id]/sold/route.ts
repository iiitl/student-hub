import dbConnect from '@/lib/dbConnect'
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Product from '@/model/Product'
import { verifyJwt } from '@/lib/auth-utils'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * PATCH /api/products/:id/sold
 * Mark a product as sold. Only the seller can mark their own listing as sold.
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

    // Verify ownership — only the seller can mark as sold
    if (product.seller.toString() !== userId) {
      return NextResponse.json(
        { message: 'Forbidden — you can only mark your own listings as sold' },
        { status: 403 }
      )
    }

    let show_when_sold = false
    const current_quantity = Number(product.quantity) || 0
    let sold_quantity = current_quantity > 0 ? current_quantity : 1
    try {
      const body = await req.json()
      if (typeof body.show_when_sold === 'boolean') {
        show_when_sold = body.show_when_sold
      }
      if (body.sold_quantity !== undefined) {
        const parsed = Number(body.sold_quantity)
        if (!isNaN(parsed) && parsed > 0) {
          sold_quantity = parsed
        }
      }
    } catch {
      // Body might be empty, fallback to defaults
    }

    if (product.is_sold && product.show_when_sold === show_when_sold) {
      return NextResponse.json(
        { message: 'Product is already marked as sold completely' },
        { status: 400 }
      )
    }

    if (sold_quantity > product.quantity) {
      return NextResponse.json(
        { message: `You cannot sell more than the available quantity (${product.quantity})` },
        { status: 400 }
      )
    }

    product.quantity -= sold_quantity

    if (product.quantity <= 0) {
      product.is_sold = true
      product.show_when_sold = show_when_sold
      product.quantity = 0
    }

    await product.save()

    return NextResponse.json(
      { message: product.is_sold ? 'Product fully sold' : `Sold ${sold_quantity} items. ${product.quantity} remaining.`, product },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('PATCH /api/products/[id]/sold error:', error)
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    )
  }
}
