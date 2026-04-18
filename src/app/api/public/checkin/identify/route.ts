import { db } from '@/lib/db'
import { notifyCustomer, buildCheckInMessage, buildRewardMessage } from '@/lib/telegram-notify'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrCode, phone, email, pin, checkIn = false } = body

    if (!qrCode || (!phone && !email && !pin)) {
      return NextResponse.json({ error: 'QR code and identification required' }, { status: 400 })
    }

    // Get business by QR code: first try QRCode table by id or code, then by slug
    let businessId: string | null = null

    const qr = await db.qRCode.findFirst({
      where: {
        OR: [
          { id: qrCode, active: true, expiresAt: { gt: new Date() } },
          { code: qrCode, active: true, expiresAt: { gt: new Date() } },
        ],
      },
    })

    // Use qr as slug to find business
    const businessBySlug = await db.business.findUnique({
      where: { slug: qrCode, active: true },
      select: { id: true },
    })
    if (businessBySlug) {
      businessId = businessBySlug.id
    }

    if (!businessId) {
      return NextResponse.json({ error: 'QR code invalid or expired' }, { status: 400 })
    }

    // Get business config
    const business = await db.business.findUnique({
      where: { id: businessId },
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
        businessId,
        OR: searchConditions,
      },
    })

    // Calculate progress toward reward (default to 10 if not configured)
    const progressNeeded = business.pointsForReward || 10

    // If check-in requested, validate and record
    let checkInResult: { success: boolean; message: string; pointsEarned?: number; rewardReached?: boolean } | null = null
    
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
      const previousVisits = customer.totalVisits
      const pointsEarned = (newVisitCount % progressNeeded === 0) ? (business.pointsPerFrequency || 1) : 0
      const justReachedReward = previousVisits < progressNeeded && newVisitCount >= progressNeeded

      // Update customer
      await db.customer.update({
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
          businessId,
          points: pointsEarned,
          notes: 'Check-in automático',
          status: 'completed',
        },
      })

      // Send Telegram notification after check-in
      const sendNotification = async () => {
        try {
          const customerForNotify = await db.customer.findUnique({
            where: { id: customer.id },
            select: {
              name: true,
              telegram: true,
              callmebot: true,
              phone: true,
              totalPoints: true,
              totalVisits: true,
            },
          })

          if (!customerForNotify) return

          const totalPoints = customerForNotify.totalPoints
          const totalVisits = customerForNotify.totalVisits
          const visitsUntilReward = Math.max(0, progressNeeded - totalVisits)

          // Send reward notification if they just reached it
          if (justReachedReward && business.rewardDescription) {
            const rewardMessage = buildRewardMessage({
              customerName: customerForNotify.name,
              businessName: business.name,
              rewardDescription: business.rewardDescription,
            })
            await notifyCustomer({
              customer: {
                telegram: customerForNotify.telegram,
                callmebot: customerForNotify.callmebot,
                phone: customerForNotify.phone,
              },
              title: '🎉 ¡Premio Disponible!',
              message: rewardMessage,
            })
          } else {
            // Send check-in confirmation
            const checkInMessage = buildCheckInMessage({
              customerName: customerForNotify.name,
              businessName: business.name,
              pointsEarned,
              totalPoints,
              visitsUntilReward,
              rewardDescription: business.rewardDescription,
            })
            await notifyCustomer({
              customer: {
                telegram: customerForNotify.telegram,
                callmebot: customerForNotify.callmebot,
                phone: customerForNotify.phone,
              },
              title: 'Check-in Confirmado',
              message: checkInMessage,
            })
          }
        } catch (notifyError) {
          console.error('Telegram notification error:', notifyError)
          // Don't fail check-in if notification fails
        }
      }

      // Fire notification asynchronously (don't wait)
      sendNotification()

      checkInResult = {
        success: true,
        message: pointsEarned > 0 
          ? `¡Ganaste ${pointsEarned} punto(s)!` 
          : 'Visita registrada',
        pointsEarned,
        rewardReached: justReachedReward,
      }
    }

    // If customer not found, return info to register
    if (!customer) {
      const needed = business.pointsForReward || 10
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
          needed: needed,
          visitsUntilReward: needed,
          reward: business.rewardDescription || 'Premio Especial',
          rewardImage: business.rewardImageUrl,
          pointsPerFrequency: business.pointsPerFrequency,
          frequency: business.frequency,
        },
      })
    }

    // Get updated customer after potential check-in
    const updatedCustomer = await db.customer.findUnique({
      where: { id: customer.id },
    })

    const needed = business.pointsForReward || 10
    const currentVisits = updatedCustomer?.totalVisits || customer.totalVisits
    const visitsUntilReward = Math.max(0, needed - currentVisits)

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        totalPoints: updatedCustomer?.totalPoints ?? customer.totalPoints,
        totalVisits: currentVisits,
      },
      business: {
        name: business.name,
        logo: business.logo,
        brandColor: business.brandColor,
        pointsForReward: business.pointsForReward,
        rewardDescription: business.rewardDescription,
        rewardImageUrl: business.rewardImageUrl,
        frequency: business.frequency,
        cooldownHours: business.cooldownHours,
      },
      checkIn: checkInResult,
      progress: {
        current: updatedCustomer?.totalPoints ?? customer.totalPoints,
        needed,
        visitsUntilReward,
        reward: business.rewardDescription || 'Premio Especial',
        rewardImage: business.rewardImageUrl,
        pointsPerFrequency: business.pointsPerFrequency,
        frequency: business.frequency,
      },
      antiCheat: {
        cooldownHours: business.cooldownHours,
        maxDailyCheckIns: business.maxDailyCheckIns,
        lastCheckIn: updatedCustomer?.lastCheckIn ?? customer.lastCheckIn,
        todayCheckIns: updatedCustomer?.lastCheckInDate === new Date().toISOString().split('T')[0] ? updatedCustomer?.checkInCountToday : 0,
      },
    })
  } catch (error: any) {
    console.error('Identify error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
