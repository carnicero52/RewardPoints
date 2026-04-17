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
        // General
        name: body.name,
        slug: body.slug,
        logo: body.logo,
        brandColor: body.brandColor,
        description: body.description,
        email: body.email,
        phone: body.phone,
        // Points - Updated with new frequency-based system
        pointsPerFrequency: body.pointsPerFrequency,
        frequency: body.frequency,
        pointsForReward: body.pointsForReward,
        rewardDescription: body.rewardDescription,
        rewardImageUrl: body.rewardImageUrl,
        // Anti-cheat
        cooldownHours: body.cooldownHours,
        maxDailyCheckIns: body.maxDailyCheckIns,
        // SMTP
        smtpEnabled: body.smtpEnabled,
        smtpHost: body.smtpHost,
        smtpPort: body.smtpPort,
        smtpUser: body.smtpUser,
        smtpPassword: body.smtpPassword,
        smtpFrom: body.smtpFrom,
        // Telegram
        telegramEnabled: body.telegramEnabled,
        telegramBotToken: body.telegramBotToken,
        telegramChatId: body.telegramChatId,
      },
    })

    return NextResponse.json(business)
  } catch (error: any) {
    console.error('Business PUT error:', error)
    return NextResponse.json({ error: 'Error updating business' }, { status: 500 })
  }
}
