import dbConnect from '@/lib/dbConnect'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { uploadOnCloudinary } from '@/helpers/cloudinary'
import Product from '@/model/Product'
import User from '@/model/User'
import { verifyJwt } from '@/lib/auth-utils'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

export const config = {
  api: {
    bodyParser: false,
  },
}

/**
 * GET /api/products
 * Fetch all available (unsold) products.
 * Public endpoint — no authentication required.
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1

    const seller = searchParams.get('seller')

    const filter: Record<string, unknown> = {}

    if (seller) {
      filter.seller = seller
    } else {
      filter.$or = [{ is_sold: false }, { is_sold: true, show_when_sold: true }]
    }

    if (search.trim()) {
      filter.$and = [
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        },
      ]
    }

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name email image')
        .populate({ path: 'comments.user', select: 'name email image' })
        .populate({ path: 'comments.replies.user', select: 'name email image' })
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ])

    return NextResponse.json(
      {
        message: 'Products fetched successfully',
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('GET /api/products error:', error)
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
 * POST /api/products
 * Create a new product listing.
 * Requires authentication — the authenticated user becomes the seller.
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    // Authenticate the user
    const authResponse = await verifyJwt(req)
    if (authResponse.status !== 200) {
      return authResponse
    }

    const authData = await authResponse.json()
    const userId = authData.userId as string

    const formData = await req.formData()

    const title = (formData.get('title') as string)?.trim()
    const description = (formData.get('description') as string)?.trim()
    const priceRaw = formData.get('price') as string
    const contact_info = (formData.get('contact_info') as string)?.trim()
    const quantityRaw = formData.get('quantity') as string
    const bulkDiscountsRaw = formData.get('bulk_discounts') as string
    const file = formData.get('image') as File | null

    // Validate required fields
    const missingFields: string[] = []
    if (!title) missingFields.push('title')
    if (!description) missingFields.push('description')
    if (!priceRaw) missingFields.push('price')
    if (!contact_info) missingFields.push('contact_info')
    if (!file) missingFields.push('image')

    if (missingFields.length > 0) {
      return NextResponse.json(
        { message: `Required fields missing: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    const price = parseFloat(priceRaw)
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { message: 'Price must be a valid non-negative number' },
        { status: 400 }
      )
    }

    let quantity = 1
    if (quantityRaw) {
      quantity = parseInt(quantityRaw, 10)
      if (isNaN(quantity) || quantity < 1) {
        return NextResponse.json(
          { message: 'Quantity must be at least 1' },
          { status: 400 }
        )
      }
    }

    let bulk_discounts: { min_quantity: number; discount_per_item: number }[] =
      []
    if (bulkDiscountsRaw) {
      try {
        bulk_discounts = JSON.parse(bulkDiscountsRaw)
        if (!Array.isArray(bulk_discounts)) throw new Error()
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
      } catch {
        return NextResponse.json(
          { message: 'Invalid bulk_discounts JSON format' },
          { status: 400 }
        )
      }
    }

    // Validate file type and size
    const allowedTypes = new Set([
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
    ])
    if (!allowedTypes.has(file!.type)) {
      return NextResponse.json(
        {
          message: 'Unsupported image format. Allowed: PNG, JPEG, WebP, GIF',
        },
        { status: 415 }
      )
    }

    const maxBytes = 10 * 1024 * 1024 // 10 MB
    if ((file!.size ?? 0) > maxBytes) {
      return NextResponse.json(
        { message: 'Image size exceeds 10 MB limit' },
        { status: 413 }
      )
    }

    // Write file to temp and upload to Cloudinary
    const bytes = await file!.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const safeExt = path
      .extname(file!.name || '')
      .replace(/[^.\w]/g, '')
      .slice(0, 10)
    const tempFilePath = path.join(
      tmpdir(),
      `product-${Date.now()}-${randomUUID()}${safeExt}`
    )
    await fs.writeFile(tempFilePath, buffer)

    let cloudinaryResult: { secure_url: string; public_id: string } | null =
      null
    try {
      cloudinaryResult = (await uploadOnCloudinary(tempFilePath)) as {
        secure_url: string
        public_id: string
      } | null
    } finally {
      await fs.unlink(tempFilePath).catch(() => {})
    }

    if (!cloudinaryResult) {
      return NextResponse.json(
        { message: 'Failed to upload image to Cloudinary' },
        { status: 500 }
      )
    }

    const product = await Product.create({
      title,
      description,
      price,
      image_url: cloudinaryResult.secure_url,
      contact_info,
      quantity,
      bulk_discounts,
      seller: userId,
    })

    return NextResponse.json(
      { message: 'Product listed successfully', product },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('POST /api/products error:', error)

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
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
