import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const addCommentSchema = z.object({
  content: z.string().min(1).max(1000),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { content } = addCommentSchema.parse(body)

    const comment = await prisma.comment.create({
      data: {
        eventId: id,
        userId: session.userId,
        content,
      },
      include: {
        user: true,
      }
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid comment data' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}
