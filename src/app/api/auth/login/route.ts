import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const staff = await db.staff.findFirst({
      where: { email: email.trim().toLowerCase(), active: true },
      include: { business: { select: { name: true, logo: true } } },
    })

    if (!staff) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await compare(password, staff.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = sign(
      { userId: staff.id, businessId: staff.businessId, role: staff.role },
      process.env.JWT_SECRET || 'royalty-qr-secret',
      { expiresIn: '7d' }
    )

    await db.staff.update({
      where: { id: staff.id },
      data: { lastLogin: new Date() },
    })

    return NextResponse.json({
      token,
      user: {
        id: staff.id,
        businessId: staff.businessId,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        businessName: staff.business.name,
        businessLogo: staff.business.logo,
      },
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}