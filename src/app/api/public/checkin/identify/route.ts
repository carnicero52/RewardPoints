import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrCode, phone, email, pin } = body

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

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado', code: 'NOT_FOUND' }, { status: 404 })
    }

    // Get reward progress
    const business = await db.business.findUnique({
      where: { id: qr.businessId },
      select: { pointsForReward: true, rewardDescription: true },
    })

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        totalPoints: customer.totalPoints,
      },
      progress: {
        current: customer.totalPoints,
        needed: business?.pointsForReward || 10,
        reward: business?.rewardDescription,
      },
    })
  } catch (error: any) {
    console.error('Identify error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}