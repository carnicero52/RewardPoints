import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)

    const customers = await db.customer.findMany({
      where: { businessId, active: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        telegram: true,
        callmebot: true,
        totalPoints: true,
        totalVisits: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(customers)
  } catch (error: any) {
    console.error('Customers error:', error)
    return NextResponse.json({ error: 'Error fetching customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)
    const body = await request.json()
    const { name, email, phone, telegram, callmebot } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const customer = await db.customer.create({
      data: {
        businessId,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        telegram: telegram?.trim() || null,
        callmebot: callmebot?.trim() || null,
        totalPoints: 0,
        totalVisits: 0,
        active: true,
      },
    })

    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Customer create error:', error)
    return NextResponse.json({ error: 'Error creating customer' }, { status: 500 })
  }
}
