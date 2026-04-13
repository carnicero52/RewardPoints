import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)

    const business = await db.business.findUnique({
      where: { id: businessId },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json(business)
  } catch (error: any) {
    console.error('Business GET error:', error)
    return NextResponse.json({ error: 'Error fetching business' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)
    const body = await request.json()

    const business = await db.business.update({
      where: { id: businessId },
      data: {
        name: body.name,
        pointsPerPurchase: body.pointsPerPurchase,
        pointsForReward: body.pointsForReward,
        rewardDescription: body.rewardDescription,
        smtpEnabled: body.smtpEnabled,
        telegramEnabled: body.telegramEnabled,
      },
    })

    return NextResponse.json(business)
  } catch (error: any) {
    console.error('Business PUT error:', error)
    return NextResponse.json({ error: 'Error updating business' }, { status: 500 })
  }
}