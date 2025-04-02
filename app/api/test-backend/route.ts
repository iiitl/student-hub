import dbConnect from '@/lib/dbConnect'

export async function POST() {
  // removed request: Request because of Eslint Errors
  await dbConnect()

  const response = {
    title: 'Message From Backend',
    message: 'Hello',
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
