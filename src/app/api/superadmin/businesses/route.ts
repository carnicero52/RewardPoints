import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const SUPERADMIN_SECRET = process.env.SUPERADMIN_SECRET || 'superadmin-fideliqr-2026'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== SUPERADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businesses = await db.business.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        pointsPerPurchase: true,
        pointsForReward: true,
        rewardDescription: true,
        active: true,
        createdAt: true,
      },
    })

    const activeCount = businesses.filter(b => b.active).length

    const totalCustomers = await db.customer.count()

    return NextResponse.json({
      businesses,
      stats: {
        totalBusinesses: businesses.length,
        activeBusinesses: activeCount,
        totalCustomers,
      },
    })
  } catch (error: any) {
    console.error('Superadmin GET error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}