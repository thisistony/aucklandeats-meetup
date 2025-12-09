import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()

    if (!session.isLoggedIn) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        redditUsername: session.redditUsername,
      }
    })
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
