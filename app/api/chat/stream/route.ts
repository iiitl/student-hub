import { chatEmitter } from '@/lib/eventEmitter'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Use a TransformStream to create a readable stream for SSE
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  // Helper to send data
  const sendEvent = async (data: any) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
    } catch (e) {
      console.error('SSE write error:', e)
    }
  }

  // Define the event listener
  const onChatUpdate = (data: any) => {
    sendEvent(data)
  }

  // Attach listener to the event emitter
  chatEmitter.on('chatUpdate', onChatUpdate)

  // Send an initial heartbeat/connection event to keep connection alive
  sendEvent({ type: 'CONNECTED' })

  // Keep-alive heartbeat interval to avoid timeout drop
  const heartbeatInterval = setInterval(() => {
    sendEvent({ type: 'HEARTBEAT' })
  }, 30000)

  // Handle client disconnects to clean up resources
  req.signal.addEventListener('abort', () => {
    clearInterval(heartbeatInterval)
    chatEmitter.off('chatUpdate', onChatUpdate)
    try {
      writer.close()
    } catch (e) {}
  })

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
