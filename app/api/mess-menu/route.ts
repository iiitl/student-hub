import { NextResponse } from 'next/server'
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin'
import { normalizeMessMenuPayload } from '@/lib/mess-menu'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isJsonCredential(input: string): boolean {
  const trimmed = input.trim()
  return trimmed.startsWith('{') && trimmed.endsWith('}')
}

export async function GET() {
  const credential = process.env.MESS_DB_CREDENTIAL?.trim()

  if (!credential) {
    return NextResponse.json(
      {
        success: false,
        message: 'MESS_DB_CREDENTIAL is not configured',
      },
      { status: 500 }
    )
  }

  try {
    if (!isJsonCredential(credential)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'MESS_DB_CREDENTIAL must be a Firebase service-account JSON string',
        },
        { status: 500 }
      )
    }

    const firestore = getFirebaseAdminFirestore(credential)
    const menuDoc = await firestore.collection('MainMenu').doc('menu').get()

    if (!menuDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          message: 'MainMenu/menu not found in Cloud Firestore',
        },
        { status: 404 }
      )
    }

    const payload = menuDoc.data() as unknown
    const menu = normalizeMessMenuPayload(payload)

    return NextResponse.json(
      {
        success: true,
        menu,
        fetchedAt: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to load mess menu:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load mess menu right now',
      },
      { status: 500 }
    )
  }
}
