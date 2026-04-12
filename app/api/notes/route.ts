import dbConnect from '@/lib/dbConnect'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { uploadOnCloudinary, deleteOnCloudinary } from '@/helpers/cloudinary'
import Note from '@/model/note'
import { verifyJwt } from '@/lib/auth-utils'
import Log from '@/model/logs'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import User from '@/model/User'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    let userId: string | null = null
    const authResponse = await verifyJwt(req)
    if (authResponse.status !== 200) {
      return authResponse
    }

    const authData = await authResponse.json()
    userId = authData.userId as string

    const formData = await req.formData()

    const content = formData.get('content') as string
    const subject = formData.get('subject') as string
    const categoryRaw = formData.get('category') as string | null
    const category: 'academic' | 'axios' =
      categoryRaw === 'axios' ? 'axios' : 'academic'
    const file = formData.get('uploaded_file') as File | null
    if (!file) {
      return NextResponse.json({ message: 'File is required' }, { status: 400 })
    }

    // Fields that differ by category
    let facultyName: string | undefined
    let year: number | undefined
    let semester: number | undefined
    let term: string | undefined
    let wing: string | undefined
    let targetAudience: string | undefined
    let presenterName: string | undefined

    if (category === 'academic') {
      facultyName = formData.get('facultyName') as string
      const yearRaw = formData.get('year') as string
      year = parseInt(yearRaw ?? '', 10)
      if (Number.isNaN(year)) {
        return NextResponse.json({ message: 'Invalid year' }, { status: 400 })
      }
      const semesterRaw = formData.get('semester') as string
      semester = parseInt(semesterRaw ?? '', 10)
      if (Number.isNaN(semester)) {
        return NextResponse.json(
          { message: 'Invalid semester' },
          { status: 400 }
        )
      }
      term = formData.get('term') as string

      const missingFields = []
      if (!subject?.trim()) missingFields.push('subject')
      if (!year) missingFields.push('year')
      if (!semester) missingFields.push('semester')
      if (!term?.trim()) missingFields.push('term')
      
      if (missingFields.length > 0) {
        return NextResponse.json(
          { message: `Required fields missing: ${missingFields.join(', ')}` },
          { status: 400 }
        )
      }
    } else {
      // axios category
      presenterName = (formData.get('presenterName') as string) || undefined
      wing = formData.get('wing') as string
      targetAudience = (formData.get('targetAudience') as string) || undefined

      const validWings = [
        'ML',
        'Web3',
        'Web',
        'FOSS',
        'InfoSec',
        'Design',
        'App',
        'CP',
      ]
      const missingFields = []
      if (!subject?.trim()) missingFields.push('subject / topic')
      if (!wing?.trim() || !validWings.includes(wing))
        missingFields.push('wing')
      if (missingFields.length > 0) {
        return NextResponse.json(
          { message: `Required fields missing: ${missingFields.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const maxBytes = 25 * 1024 * 1024
    const allowed = new Set([
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
    ])
    if (!allowed.has(file.type)) {
      return NextResponse.json(
        { message: 'Unsupported file format' },
        { status: 415 }
      )
    }
    if ((file.size ?? 0) > maxBytes) {
      return NextResponse.json(
        { message: 'File uploaded is too large' },
        { status: 413 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const safeExt = path
      .extname(file.name || '')
      .replace(/[^.\w]/g, '')
      .slice(0, 10)
    const tempFilePath = path.join(
      tmpdir(),
      `note-${Date.now()}-${randomUUID()}${safeExt}`
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
        { message: 'Failed to upload file to Cloudinary' },
        { status: 500 }
      )
    }

    let note
    try {
      note = await Note.create({
        ...(category === 'academic'
          ? { facultyName, year, semester, term }
          : { presenterName, wing, targetAudience }),
        content,
        subject,
        category,
        document_url: cloudinaryResult.secure_url,
        storage_asset_id: cloudinaryResult.public_id,
        file_name: file.name,
        file_type: file.type,
        uploaded_by: userId,
      })
    } catch (dbError) {
      // DB write failed — clean up the already-uploaded Cloudinary asset
      await deleteOnCloudinary(cloudinaryResult.public_id).catch(() => {})
      throw dbError
    }

    // Log failure must not surface as a 500 — the note was already saved
    await Log.create({
      user: userId,
      action: 'Note upload succeeded',
      note: note._id,
    }).catch((logError: unknown) => {
      console.error('Note upload log failed:', logError)
    })

    return NextResponse.json(
      { message: 'Note uploaded successfully', note },
      { status: 201 }
    )
  } catch (error: unknown) {
    await Log.create({
      user: null,
      action: 'Note upload failed',
      error: 'Failed to upload file to Cloudinary',
      details: error instanceof Error ? error.stack : 'Unknown error',
    })

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
        message: 'Internal server error ',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const query = searchParams.get('query') || ''
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const rawSortType = parseInt(searchParams.get('sortType') || '-1', 10)
    const sortType = rawSortType === 1 ? 1 : -1
    const subjectFilter = searchParams.get('subject')
    const termFilter = searchParams.get('term')
    const yearFilter = searchParams.get('year')
    const categoryFilter = searchParams.get('category')

    const match: Record<string, unknown> = {}
    if (subjectFilter) {
      match.subject = { $regex: `^${subjectFilter}$`, $options: 'i' }
    }
    if (termFilter) {
      match.term = { $regex: `^${termFilter}$`, $options: 'i' }
    }
    if (yearFilter) {
      const y = parseInt(yearFilter, 10)
      if (!Number.isNaN(y)) match.year = y
    }
    if (
      categoryFilter &&
      (categoryFilter === 'academic' || categoryFilter === 'axios')
    ) {
      match.category = categoryFilter
    }
    if (search && query) {
      match[search] = { $regex: query, $options: 'i' }
    }

    const pipeline = [
      {
        $match: match,
      },
      {
        $lookup: {
          from: 'users',
          localField: 'uploaded_by',
          foreignField: '_id',
          as: 'ownerDetails',
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$ownerDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]

    const NoteModel = Note as unknown as {
      aggregatePaginate: (agg: unknown, opts: unknown) => Promise<unknown>
    }
    const notes = await NoteModel.aggregatePaginate(Note.aggregate(pipeline), {
      page,
      limit,
      sort: { [sortBy]: sortType },
      customLabels: { docs: 'notes' },
    })

    if (!notes) {
      return NextResponse.json(
        { message: 'Error in fetching notes' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Notes fetched succesfully', notes },
      { status: 200 }
    )
  } catch (error: unknown) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect()

    const authResponse = await verifyJwt(req)
    if (authResponse.status !== 200) {
      return authResponse
    }

    const authData = await authResponse.json()
    const userId = authData.userId as string

    const { searchParams } = new URL(req.url)
    const noteId = searchParams.get('id')

    if (!noteId) {
      return NextResponse.json(
        { message: 'Note ID is required' },
        { status: 400 }
      )
    }

    const note = await Note.findById(noteId)
    if (!note) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const isUploader = note.uploaded_by.toString() === userId
    const isTechnicalClub = user.email === 'technicalclub@iiitl.ac.in'

    if (!isUploader && !isTechnicalClub) {
      return NextResponse.json(
        { message: 'You are not authorized to delete this note' },
        { status: 403 }
      )
    }

    // Remove the backing Cloudinary file first
    if (note.storage_asset_id) {
      try {
        await deleteOnCloudinary(note.storage_asset_id)
      } catch (cloudinaryErr) {
        // Log but don't block deletion — DB row still gets removed
        console.error('Cloudinary file deletion failed:', cloudinaryErr)
        await Log.create({
          user: userId,
          action: 'Note Cloudinary file deletion failed',
          note: noteId,
          details:
            cloudinaryErr instanceof Error
              ? cloudinaryErr.message
              : 'Unknown error',
        })
      }
    }

    await Note.findByIdAndDelete(noteId)

    await Log.create({
      user: userId,
      action: 'Note deleted',
      note: noteId,
      details: `Note "${note.facultyName}" deleted by ${user.email}`,
    })

    return NextResponse.json(
      { message: 'Note deleted successfully' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Delete error:', error)

    await Log.create({
      user: null,
      action: 'Note deletion failed',
      error: 'Failed to delete note',
      details: error instanceof Error ? error.stack : 'Unknown error',
    })

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect()

    const authResponse = await verifyJwt(req)
    if (authResponse.status !== 200) {
      return authResponse
    }

    const authData = await authResponse.json()
    const userId = authData.userId as string

    const { searchParams } = new URL(req.url)
    const noteId = searchParams.get('id')

    if (!noteId) {
      return NextResponse.json(
        { message: 'Note ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const {
      facultyName,
      content,
      subject,
      year,
      semester,
      term,
      category,
      wing,
      targetAudience,
      presenterName,
    } = body

    const note = await Note.findById(noteId)
    if (!note) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const isUploader = note.uploaded_by.toString() === userId
    const isTechnicalClub = user.email === 'technicalclub@iiitl.ac.in'

    if (!isUploader && !isTechnicalClub) {
      return NextResponse.json(
        { message: 'You are not authorized to edit this note' },
        { status: 403 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (facultyName) updateData.facultyName = facultyName
    if (content) updateData.content = content
    if (subject) updateData.subject = subject
    if (year) {
      const yearNum = parseInt(year, 10)
      if (isNaN(yearNum)) {
        return NextResponse.json({ message: 'Invalid year' }, { status: 400 })
      }
      updateData.year = yearNum
    }
    if (semester) {
      const semesterNum = parseInt(semester, 10)
      if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
        return NextResponse.json(
          { message: 'Invalid semester (must be 1-8)' },
          { status: 400 }
        )
      }
      updateData.semester = semesterNum
    }
    if (term) {
      const validTerms = ['Mid', 'End']
      if (!validTerms.includes(term)) {
        return NextResponse.json({ message: 'Invalid term' }, { status: 400 })
      }
      updateData.term = term
    }
    if (category) {
      const validCategories = ['academic', 'axios']
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { message: 'Invalid category' },
          { status: 400 }
        )
      }
      updateData.category = category
    }
    if (wing) {
      const validWings = [
        'ML',
        'Web3',
        'Web',
        'FOSS',
        'InfoSec',
        'Design',
        'App',
        'CP',
      ]
      if (!validWings.includes(wing)) {
        return NextResponse.json({ message: 'Invalid wing' }, { status: 400 })
      }
      updateData.wing = wing
    }
    if (targetAudience) updateData.targetAudience = targetAudience
    if (presenterName) updateData.presenterName = presenterName

    updateData.$push = {
      updated_by: {
        user: userId,
        updatedAt: new Date(),
      },
    }

    const updatedNote = await Note.findByIdAndUpdate(noteId, updateData, {
      new: true,
      runValidators: true,
    })

    await Log.create({
      user: userId,
      action: 'Note updated',
      note: noteId,
      details: `Note "${note.facultyName}" updated by ${user.email}`,
    })

    return NextResponse.json(
      { message: 'Note updated successfully', note: updatedNote },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Update error:', error)

    await Log.create({
      user: null,
      action: 'Note update failed',
      error: 'Failed to update note',
      details: error instanceof Error ? error.stack : 'Unknown error',
    })

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
