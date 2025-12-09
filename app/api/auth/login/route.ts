import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const loginSchema = z.object({
  redditUsername: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { redditUsername } = loginSchema.parse(body)

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { redditUsername },
    })

    if (!user) {
      user = await prisma.user.create({
        data: { redditUsername },
      })
    }

    // Create session
    const session = await getSession()
    session.userId = user.id
    session.redditUsername = user.redditUsername
    session.isLoggedIn = true
    await session.save()

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        redditUsername: user.redditUsername,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid username format' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to login' },
      { status: 500 }
    )
  }
}
