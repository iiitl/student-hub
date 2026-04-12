import dbConnect from '@/lib/dbConnect'
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Product from '@/model/Product'
import { verifyJwt } from '@/lib/auth-utils'
import { deleteOnCloudinary } from '@/helpers/cloudinary'
import { getPublicIdFromUrl } from '@/lib/cloudinary-utils'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * PUT /api/products/:id
 * Update a product listing. Only the seller can update their own listing.
 */
export async function PUT(req: NextRequest, context: RouteContext) {
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

    // Verify ownership — only the seller can update
    if (product.seller.toString() !== userId) {
      return NextResponse.json(
        { message: 'Forbidden — you can only update your own listings' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      title,
      description,
      price,
      contact_info,
      quantity,
      bulk_discounts,
    } = body

    const updateData: Record<string, unknown> = {}

    if (title !== undefined) {
      const trimmed = String(title).trim()
      if (!trimmed) {
        return NextResponse.json(
          { message: 'Title cannot be empty' },
          { status: 400 }
        )
      }
      if (trimmed.length > 40) {
        return NextResponse.json(
          { message: 'Title cannot exceed 40 characters' },
          { status: 400 }
        )
      }
      updateData.title = trimmed
    }

    if (description !== undefined) {
      const trimmed = String(description).trim()
      if (!trimmed) {
        return NextResponse.json(
          { message: 'Description cannot be empty' },
          { status: 400 }
        )
      }
      updateData.description = trimmed
    }

    if (price !== undefined) {
      const parsed = parseFloat(price)
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          { message: 'Price must be a valid non-negative number' },
          { status: 400 }
        )
      }
      updateData.price = parsed
    }

    if (contact_info !== undefined) {
      const trimmed = String(contact_info).trim()
      if (!trimmed) {
        return NextResponse.json(
          { message: 'Contact info cannot be empty' },
          { status: 400 }
        )
      }
      updateData.contact_info = trimmed
    }

    if (quantity !== undefined) {
      const parsed = parseInt(quantity as string, 10)
      if (isNaN(parsed) || parsed < 1) {
        return NextResponse.json(
          { message: 'Quantity must be at least 1' },
          { status: 400 }
        )
      }
      updateData.quantity = parsed
    }

    if (bulk_discounts !== undefined) {
      if (!Array.isArray(bulk_discounts)) {
        return NextResponse.json(
          { message: 'bulk_discounts must be an array' },
          { status: 400 }
        )
      }
      if (bulk_discounts.length > 10) {
        return NextResponse.json(
          { message: 'Cannot exceed 10 bulk discount conditions' },
          { status: 400 }
        )
      }
      for (const discount of bulk_discounts) {
        if (
          typeof discount.min_quantity !== 'number' ||
          typeof discount.discount_per_item !== 'number' ||
          discount.min_quantity < 2 ||
          discount.discount_per_item <= 0
        ) {
          return NextResponse.json(
            { message: 'Invalid bulk discount condition' },
            { status: 400 }
          )
        }
      }
      updateData.bulk_discounts = bulk_discounts
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('seller', 'name email image')

    return NextResponse.json(
      { message: 'Product updated successfully', product: updatedProduct },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('PUT /api/products/[id] error:', error)

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        {
          message: 'Validation failed',
          errors: (error as Error & { errors?: unknown }).errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/products/:id
 * Delete a product listing. Only the seller can delete their own listing.
 * Also removes the product image from Cloudinary.
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
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

    // Verify ownership — only the seller can delete
    if (product.seller.toString() !== userId) {
      return NextResponse.json(
        { message: 'Forbidden — you can only delete your own listings' },
        { status: 403 }
      )
    }

    // Remove the image from Cloudinary
    if (product.image_url) {
      const publicId = getPublicIdFromUrl(product.image_url)
      if (publicId) {
        try {
          await deleteOnCloudinary(publicId)
        } catch (cloudinaryErr) {
          console.error('Cloudinary image deletion failed:', cloudinaryErr)
        }
      }
    }

    await Product.findByIdAndDelete(id)

    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('DELETE /api/products/[id] error:', error)
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    )
  }
}
