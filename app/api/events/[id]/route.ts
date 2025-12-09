import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: true,
        restaurants: {
          include: {
            votes: {
              include: {
                user: true,
              }
            }
          }
        },
        timeSlots: {
          include: {
            votes: {
              include: {
                user: true,
              }
            }
          },
          orderBy: { startTime: 'asc' }
        },
        rsvps: {
          include: {
            user: true,
          }
        },
        comments: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ event })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin =
      session.redditUsername?.toLowerCase() === 'ancient_lettuce6821'

    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
      select: { createdById: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!isAdmin && event.createdById !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Gather child IDs for clean deletion
    const [restaurants, timeSlots] = await Promise.all([
      prisma.restaurant.findMany({ where: { eventId: id }, select: { id: true } }),
      prisma.timeSlot.findMany({ where: { eventId: id }, select: { id: true } }),
    ])

    const restaurantIds = restaurants.map(r => r.id)
    const timeSlotIds = timeSlots.map(t => t.id)

    await prisma.$transaction([
      prisma.restaurantVote.deleteMany({ where: { restaurantId: { in: restaurantIds } } }),
      prisma.timeSlotVote.deleteMany({ where: { timeSlotId: { in: timeSlotIds } } }),
      prisma.restaurant.deleteMany({ where: { eventId: id } }),
      prisma.timeSlot.deleteMany({ where: { eventId: id } }),
      prisma.rSVP.deleteMany({ where: { eventId: id } }),
      prisma.comment.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
