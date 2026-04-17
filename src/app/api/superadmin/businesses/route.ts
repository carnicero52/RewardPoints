import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const SUPERADMIN_SECRET = process.env.SUPERADMIN_SECRET || 'superadmin-fideliqr-2026'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    console.log('Secret received:', secret)
    console.log('Expected:', SUPERADMIN_SECRET)

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
        pointsPerFrequency: true,
        frequency: true,
        pointsForReward: true,
        rewardDescription: true,
        rewardImageUrl: true,
        cooldownHours: true,
        maxDailyCheckIns: true,
        active: true,
        createdAt: true,
      },
    })

    // Get counts for each business
    const businessesWithCounts = await Promise.all(
      businesses.map(async (business) => {
        const customersCount = await db.customer.count({
          where: { businessId: business.id },
        })
        const transactionsCount = await db.transaction.count({
          where: { businessId: business.id },
        })
        const rewardsRedeemed = await db.customerReward.count({
          where: { reward: { businessId: business.id } },
        })
        return {
          ...business,
          customersCount,
          transactionsCount,
          rewardsRedeemed,
        }
      })
    )

    const activeCount = businesses.filter(b => b.active).length
    const totalCustomers = await db.customer.count()

    return NextResponse.json({
      businesses: businessesWithCounts,
      stats: {
        totalBusinesses: businesses.length,
        activeBusinesses: activeCount,
        totalCustomers,
      },
    })
  } catch (error: any) {
    console.error('Superadmin GET error:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}