import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Note from '@/model/note'

export async function GET() {
  try {
    await dbConnect()

    const subjects = await Note.distinct('subject')

    return NextResponse.json({
      success: true,
      subjects: subjects.sort(),
    })
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subjects' },
      { status: 500 }
    )
  }
}
