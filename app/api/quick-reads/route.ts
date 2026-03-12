import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Redirect to categories — QuickReads are now markdown content within categories
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message:
        'This endpoint is deprecated. Use /api/quick_read_categories instead.',
    },
    { status: 410 }
  )
}
