import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import ProposedChange from '@/model/ProposedChange'
import Category from '@/model/quick_read_category'
import User from '@/model/User'
import { verifyJwt } from '@/lib/auth-utils'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

// Admins only: Get all pending proposed changes grouped by batch
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const authResponse = await verifyJwt(request)
    if (authResponse.status !== 200) return authResponse

    const authData = await authResponse.json()
    const userId = authData.userId as string

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const isSuperAdmin = user.email === 'technicalclub@iiitl.ac.in'
    const hasAdminRole =
      Array.isArray(user.roles) && user.roles.includes('admin')

    if (!isSuperAdmin && !hasAdminRole) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admins only.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'pending'

    const proposals = await ProposedChange.find({ status: statusFilter })
      .sort({ createdAt: 1 })
      .populate('proposedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .lean()

    // Group by batchId
    const batches: Record<
      string,
      {
        batchId: string
        proposedBy: { name: string; email: string } | null
        createdAt: string
        changes: typeof proposals
      }
    > = {}

    for (const p of proposals) {
      const bid = p.batchId || p._id.toString()
      if (!batches[bid]) {
        batches[bid] = {
          batchId: bid,
          proposedBy: p.proposedBy as unknown as {
            name: string
            email: string
          } | null,
          createdAt: p.createdAt.toISOString(),
          changes: [],
        }
      }
      batches[bid].changes.push(p)
    }

    return NextResponse.json(
      { success: true, batches: Object.values(batches) },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching proposed changes:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch proposed changes' },
      { status: 500 }
    )
  }
}

// Any logged-in user: Submit a batch of proposed changes
export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const authResponse = await verifyJwt(request)
    if (authResponse.status !== 200) return authResponse

    const authData = await authResponse.json()
    const userId = authData.userId as string

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { changes } = body

    if (!Array.isArray(changes) || changes.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No changes provided' },
        { status: 400 }
      )
    }

    const batchId = randomUUID()

    const docs = changes.map(
      (change: {
        changeType: string
        targetType: string
        targetCategoryId?: string
        proposedData?: Record<string, string>
      }) => ({
        changeType: change.changeType,
        targetType: change.targetType || 'category',
        status: 'pending',
        batchId,
        proposedBy: userId,
        targetCategoryId: change.targetCategoryId || undefined,
        proposedData: change.proposedData || {},
      })
    )

    await ProposedChange.insertMany(docs)

    return NextResponse.json(
      {
        success: true,
        message: `${docs.length} change(s) proposed for review.`,
        batchId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting batch:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to submit proposed changes' },
      { status: 500 }
    )
  }
}

// Admins only: Approve or reject an entire batch
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect()

    const authResponse = await verifyJwt(request)
    if (authResponse.status !== 200) return authResponse

    const authData = await authResponse.json()
    const userId = authData.userId as string

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const isSuperAdmin = user.email === 'technicalclub@iiitl.ac.in'
    const hasAdminRole =
      Array.isArray(user.roles) && user.roles.includes('admin')

    if (!isSuperAdmin && !hasAdminRole) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admins only.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { batchId, action, reviewNote } = body

    if (!batchId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: 'batchId and valid action (approve/reject) required',
        },
        { status: 400 }
      )
    }

    const proposals = await ProposedChange.find({
      batchId,
      status: 'pending',
    }).sort({ createdAt: 1 })

    if (proposals.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No pending proposals found for this batch',
        },
        { status: 404 }
      )
    }

    if (action === 'reject') {
      await ProposedChange.updateMany(
        { batchId, status: 'pending' },
        {
          $set: {
            status: 'rejected',
            reviewedBy: userId,
            reviewNote: reviewNote || '',
          },
        }
      )

      return NextResponse.json(
        { success: true, message: 'Batch rejected' },
        { status: 200 }
      )
    }

    // action === 'approve' — process add first, then edits, then deletes
    const adds = proposals.filter((p) => p.changeType === 'add')
    const edits = proposals.filter((p) => p.changeType === 'edit')
    const deletes = proposals.filter((p) => p.changeType === 'delete')

    // Process category additions
    for (const proposal of adds) {
      const catName = proposal.proposedData?.categoryName
      if (catName) {
        const exists = await Category.findOne({
          name: { $regex: new RegExp(`^${catName}$`, 'i') },
        })
        if (!exists) {
          await Category.create({
            name: catName,
            content: proposal.proposedData?.newContent || '',
            visibility: proposal.proposedData?.visibility || 'public',
            createdBy: proposal.proposedBy,
          })
        }
      }
    }

    // Process edits (content updates / renames)
    for (const proposal of edits) {
      const category = await Category.findById(proposal.targetCategoryId)
      if (category) {
        if (proposal.proposedData?.categoryName) {
          category.name = proposal.proposedData.categoryName
        }
        if (proposal.proposedData?.newContent !== undefined) {
          category.content = proposal.proposedData.newContent
        }
        if (proposal.proposedData?.visibility !== undefined) {
          category.visibility = proposal.proposedData.visibility as 'public' | 'college_only'
        }
        await category.save()
      }
    }

    // Process deletes
    for (const proposal of deletes) {
      await Category.findByIdAndDelete(proposal.targetCategoryId)
    }

    // Mark all as approved
    await ProposedChange.updateMany(
      { batchId, status: 'pending' },
      { $set: { status: 'approved', reviewedBy: userId } }
    )

    return NextResponse.json(
      { success: true, message: 'Batch approved and all changes applied' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error reviewing batch:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to review batch' },
      { status: 500 }
    )
  }
}
