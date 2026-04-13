import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrCode, name, phone, email, pin } = body

    if (!qrCode || !name?.trim()) {
      return NextResponse.json({ error: 'QR code and name required' }, { status: 400 })
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

    // Check for existing customer with same phone/email
    const existingConditions: any[] = []
    if (phone) existingConditions.push({ phone })
    if (email) existingConditions.push({ email })

    if (existingConditions.length > 0) {
      const existing = await db.customer.findFirst({
        where: {
          businessId: qr.businessId,
          OR: existingConditions,
        },
      })

      if (existing) {
        return NextResponse.json({ 
          error: 'Ya existe un cliente con estos datos. Por favor inicia sesión.' 
        }, { status: 409 })
      }
    }

    // Generate PIN if not provided
    const generatedPin = pin || Math.floor(100000 + Math.random() * 900000).toString()

    // Create customer
    const customer = await db.customer.create({
      data: {
        businessId: qr.businessId,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        pin: generatedPin,
        totalPoints: 0,
        totalVisits: 0,
      },
    })

    // Get business config
    const business = await db.business.findUnique({
      where: { id: qr.businessId },
      select: { pointsPerPurchase: true, pointsForReward: true, rewardDescription: true },
    })

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        totalPoints: customer.totalPoints,
        pin: generatedPin,
      },
      message: 'Cliente registrado exitosamente',
    })
  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}