import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const rsvpSchema = z.object({
  status: z.enum(['going', 'maybe', 'not_going']),
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
    const { status } = rsvpSchema.parse(body)

    const rsvp = await prisma.rSVP.upsert({
      where: {
        eventId_userId: {
          eventId: id,
          userId: session.userId,
        }
      },
      update: { status },
      create: {
        eventId: id,
        userId: session.userId,
        status,
      },
      include: {
        user: true,
      }
    })

    return NextResponse.json({ rsvp })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid RSVP status' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update RSVP' },
      { status: 500 }
    )
  }
}
