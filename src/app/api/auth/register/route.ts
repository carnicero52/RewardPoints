import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessName, name, email, password, phone } = body

    if (!businessName?.trim() || !name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Check if email exists globally
    const existingStaff = await db.staff.findFirst({
      where: { email: email.trim().toLowerCase() },
    })

    if (existingStaff) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    // Create business + staff in transaction
    const result = await db.$transaction(async (tx) => {
      // Create business
      const business = await tx.business.create({
        data: {
          name: businessName.trim(),
          slug: businessName.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
          phone: phone?.trim() || null,
        },
      })

      // Create admin staff
      const passwordHash = await hash(password, 12)
      const staff = await tx.staff.create({
        data: {
          businessId: business.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          passwordHash,
          role: 'admin',
        },
      })

      return { business, staff }
    })

    return NextResponse.json({
      success: true,
      businessId: result.business.id,
      message: 'Business created successfully',
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}