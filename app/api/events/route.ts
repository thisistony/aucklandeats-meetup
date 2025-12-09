import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  date: z.string().datetime(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  location: z.string().max(300).optional(),
})

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        createdBy: true,
        _count: {
          select: { rsvps: true, restaurants: true, comments: true }
        }
      },
      orderBy: { date: 'asc' }
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, date, startTime, endTime, location } = createEventSchema.parse(body)

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        location: location || null,
        createdById: session.userId,
      },
      include: {
        createdBy: true,
      }
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
