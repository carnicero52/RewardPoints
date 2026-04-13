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