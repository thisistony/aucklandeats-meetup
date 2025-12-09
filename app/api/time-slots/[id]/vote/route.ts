import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

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

    const vote = await prisma.timeSlotVote.upsert({
      where: {
        timeSlotId_userId: {
          timeSlotId: id,
          userId: session.userId,
        }
      },
      update: {},
      create: {
        timeSlotId: id,
        userId: session.userId,
      },
      include: {
        user: true,
      }
    })

    return NextResponse.json({ vote })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to vote' },
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    await prisma.timeSlotVote.delete({
      where: {
        timeSlotId_userId: {
          timeSlotId: id,
          userId: session.userId,
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove vote' },
      { status: 500 }
    )
  }
}
