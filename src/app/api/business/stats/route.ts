import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)

    const [totalCustomers, totalTransactions, activeRewards, totalPoints] = await Promise.all([
      db.customer.count({ where: { businessId, active: true } }),
      db.transaction.count({ where: { businessId } }),
      db.reward.count({ where: { businessId, active: true } }),
      db.customer.aggregate({
        where: { businessId, active: true },
        _sum: { totalPoints: true },
      }),
    ])

    return NextResponse.json({
      totalCustomers,
      totalTransactions,
      activeRewards,
      totalPointsGiven: totalPoints._sum.totalPoints || 0,
    })
  } catch (error: any) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 })
  }
}