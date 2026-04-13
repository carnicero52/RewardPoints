import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)

    const transactions = await db.transaction.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { customer: { select: { name: true } } },
    })

    return NextResponse.json(transactions)
  } catch (error: any) {
    console.error('Transactions error:', error)
    return NextResponse.json({ error: 'Error fetching transactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)
    const body = await request.json()
    const { customerId, points, notes, amount } = body

    if (!customerId || !points) {
      return NextResponse.json({ error: 'Customer and points required' }, { status: 400 })
    }

    // Verify customer belongs to this business
    const customer = await db.customer.findFirst({
      where: { id: customerId, businessId },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Create transaction and update customer points in one transaction
    const result = await db.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          customerId,
          businessId,
          points: parseInt(points),
          amount: amount ? parseFloat(amount) : null,
          notes: notes || null,
          status: 'completed',
        },
      })

      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalPoints: { increment: parseInt(points) },
          totalVisits: { increment: 1 },
        },
      })

      return transaction
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Create transaction error:', error)
    return NextResponse.json({ error: 'Error creating transaction' }, { status: 500 })
  }
}