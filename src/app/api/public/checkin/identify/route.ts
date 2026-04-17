import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrCode, phone, email, pin, checkIn = false } = body

    if (!qrCode || (!phone && !email && !pin)) {
      return NextResponse.json({ error: 'QR code and identification required' }, { status: 400 })
    }

    // Get QR code to find business
    const qr = await db.qRCode.findFirst({
      where: {
        id: qrCode,
        active: true,
        expiresAt: { gt: new Date() },
      },
    })

    if (!qr) {
      return NextResponse.json({ error: 'QR code invalid or expired' }, { status: 400 })
    }

    // Get business config
    const business = await db.business.findUnique({
      where: { id: qr.businessId },
      select: {
        name: true,
        logo: true,
        brandColor: true,
        pointsPerFrequency: true,
        frequency: true,
        pointsForReward: true,
        rewardDescription: true,
        rewardImageUrl: true,
        cooldownHours: true,
        maxDailyCheckIns: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Search customer
    const searchConditions: any[] = []
    if (phone) searchConditions.push({ phone: { contains: phone }, active: true })
    if (email) searchConditions.push({ email: { contains: email.toLowerCase() }, active: true })
    if (pin) searchConditions.push({ pin: pin, active: true })

    const customer = await db.customer.findFirst({
      where: {
        businessId: qr.businessId,
        OR: searchConditions,
      },
    })

    // Calculate progress toward reward
    const progressNeeded = business.frequency || 1
    const visitsUntilReward = Math.max(0, business.pointsForReward - customer.totalVisits)

    // If check-in requested, validate and record
    let checkInResult: { success: boolean; message: string; pointsEarned?: number } | null = null
    
    if (checkIn && customer) {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      
      // Anti-cheat checks
      if (business.cooldownHours && customer.lastCheckIn) {
        const hoursSinceLastCheckIn = (now.getTime() - new Date(customer.lastCheckIn).getTime()) / (1000 * 60 * 60)
        if (hoursSinceLastCheckIn < business.cooldownHours) {
          return NextResponse.json({ 
            error: `Debes esperar ${Math.ceil(business.cooldownHours - hoursSinceLastCheckIn)} horas antes de otro check-in`,
            code: 'COOLDOWN',
            cooldownHours: business.cooldownHours,
            hoursSinceLastCheckIn: Math.round(hoursSinceLastCheckIn),
          }, { status: 429 })
        }
      }
      
      if (business.maxDailyCheckIns && customer.lastCheckInDate === today) {
        if (customer.checkInCountToday >= business.maxDailyCheckIns) {
          return NextResponse.json({ 
            error: `Ya alcanzaste el límite de ${business.maxDailyCheckIns} check-in(s) hoy`,
            code: 'DAILY_LIMIT',
            maxDailyCheckIns: business.maxDailyCheckIns,
          }, { status: 429 })
        }
      }

      // Calculate points to earn based on frequency
      const newVisitCount = customer.totalVisits + 1
      const pointsEarned = (newVisitCount % progressNeeded === 0) ? (business.pointsPerFrequency || 1) : 0

      // Update customer
      const updatedCustomer = await db.customer.update({
        where: { id: customer.id },
        data: {
          totalVisits: { increment: 1 },
          totalPoints: { increment: pointsEarned },
          lastCheckIn: now,
          lastCheckInDate: today,
          checkInCountToday: customer.lastCheckInDate === today ? { increment: 1 } : 1,
        },
      })

      // Create transaction record
      await db.transaction.create({
        data: {
          customerId: customer.id,
          businessId: qr.businessId,
          points: pointsEarned,
          notes: 'Check-in automático',
          status: 'completed',
        },
      })

      checkInResult = {
        success: true,
        message: pointsEarned > 0 
          ? `¡Ganaste ${pointsEarned} punto(s)!` 
          : 'Visita registrada',
        pointsEarned,
      }
    }

    // If customer not found, return info to register
    if (!customer) {
      return NextResponse.json({
        needsRegistration: true,
        business: {
          name: business.name,
          logo: business.logo,
          brandColor: business.brandColor,
          pointsForReward: business.pointsForReward,
          rewardDescription: business.rewardDescription,
          rewardImageUrl: business.rewardImageUrl,
          frequency: business.frequency,
        },
        progress: {
          current: 0,
          needed: business.pointsForReward,
          visitsUntilReward: business.pointsForReward,
          reward: business.rewardDescription,
          rewardImage: business.rewardImageUrl,
        },
      })
    }

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        totalPoints: customer.totalPoints,
        totalVisits: customer.totalVisits,
      },
      business: {
        name: business.name,
        logo: business.logo,
        brandColor: business.brandColor,
      },
      checkIn: checkInResult,
      progress: {
        current: customer.totalPoints,
        needed: business.pointsForReward,
        visitsUntilReward: Math.max(0, business.pointsForReward - customer.totalVisits),
        reward: business.rewardDescription,
        rewardImage: business.rewardImageUrl,
        pointsPerFrequency: business.pointsPerFrequency,
        frequency: business.frequency,
      },
      antiCheat: {
        cooldownHours: business.cooldownHours,
        maxDailyCheckIns: business.maxDailyCheckIns,
        lastCheckIn: customer.lastCheckIn,
        todayCheckIns: customer.lastCheckInDate === new Date().toISOString().split('T')[0] ? customer.checkInCountToday : 0,
      },
    })
  } catch (error: any) {
    console.error('Identify error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}