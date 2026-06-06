import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Note from '@/model/note'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await dbConnect()

  const note = await Note.findById(id).lean()
  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: (note._id as { toString(): string }).toString(),
    subject: note.subject,
    facultyName: note.facultyName,
    semester: note.semester,
    exam: note.term,
    batch: note.year,
    url: note.document_url,
    fileType: note.file_type,
    fileName: note.file_name,
    description: note.content,
    category: note.category,
  })
}
