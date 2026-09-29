import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Paper from '@/model/paper'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await dbConnect()

  const paper = await Paper.findById(id).lean()
  if (!paper) {
    return NextResponse.json({ error: 'Paper not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: (paper._id as { toString(): string }).toString(),
    subject: paper.subject,
    facultyName: paper.facultyName,
    semester: paper.semester,
    exam: paper.term,
    batch: paper.year,
    url: paper.document_url,
    fileType: paper.file_type,
    fileName: paper.file_name,
    description: paper.content,
  })
}
