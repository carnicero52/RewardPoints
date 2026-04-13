import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)

    const rewards = await db.reward.findMany({
      where: { businessId },
      orderBy: { pointsNeeded: 'asc' },
    })

    return NextResponse.json(rewards)
  } catch (error: any) {
    console.error('Rewards error:', error)
    return NextResponse.json({ error: 'Error fetching rewards' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)
    const body = await request.json()
    const { name, description, pointsNeeded } = body

    if (!name || !pointsNeeded) {
      return NextResponse.json({ error: 'Name and points required' }, { status: 400 })
    }

    const reward = await db.reward.create({
      data: {
        businessId,
        name,
        description: description || null,
        pointsNeeded: parseInt(pointsNeeded),
      },
    })

    return NextResponse.json(reward)
  } catch (error: any) {
    console.error('Create reward error:', error)
    return NextResponse.json({ error: 'Error creating reward' }, { status: 500 })
  }
}