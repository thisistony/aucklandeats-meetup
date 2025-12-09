import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const addRestaurantSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  placeId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
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
    const data = addRestaurantSchema.parse(body)

    const restaurant = await prisma.restaurant.create({
      data: {
        ...data,
        eventId: id,
      }
    })

    return NextResponse.json({ restaurant }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid restaurant data' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to add restaurant' },
      { status: 500 }
    )
  }
}
