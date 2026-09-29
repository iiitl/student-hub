import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'

const SUPPORTED_PROVIDERS = [
  'Anthropic',
  'OpenAI',
  'Gemini',
  'Groq',
  'Mistral',
  'Cohere',
]

function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••'
  return '•'.repeat(key.length - 4) + key.slice(-4)
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await dbConnect()
  const user = await User.findOne({ email: session.user.email }).select(
    '+llmApiKey llmProvider'
  )

  if (!user?.llmApiKey) {
    return NextResponse.json({ hasKey: false })
  }

  return NextResponse.json({
    hasKey: true,
    provider: user.llmProvider,
    maskedKey: maskApiKey(user.llmApiKey),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { provider, apiKey } = body

  if (!provider || !SUPPORTED_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
    return NextResponse.json(
      { error: 'API key must be at least 8 characters' },
      { status: 400 }
    )
  }

  await dbConnect()
  const user = await User.findOne({ email: session.user.email }).select(
    '+llmApiKey'
  )

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.llmApiKey) {
    return NextResponse.json(
      { error: 'API key already set. Delete it first to add a new one.' },
      { status: 409 }
    )
  }

  user.llmProvider = provider
  user.llmApiKey = apiKey.trim()
  await user.save()

  return NextResponse.json({
    message: 'API key saved successfully',
    provider,
    maskedKey: maskApiKey(apiKey.trim()),
  })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await dbConnect()
  await User.findOneAndUpdate(
    { email: session.user.email },
    { $unset: { llmApiKey: '', llmProvider: '' } }
  )

  return NextResponse.json({ message: 'API key deleted successfully' })
}
