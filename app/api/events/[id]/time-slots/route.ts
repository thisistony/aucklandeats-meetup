import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const addTimeSlotSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
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
    const { startTime, endTime } = addTimeSlotSchema.parse(body)

    const timeSlot = await prisma.timeSlot.create({
      data: {
        eventId: id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      }
    })

    return NextResponse.json({ timeSlot }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid time slot data' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to add time slot' },
      { status: 500 }
    )
  }
}
