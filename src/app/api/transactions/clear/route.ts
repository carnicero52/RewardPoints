import { getAuthPayload } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)

    // Delete all transactions for this business
    await db.transaction.deleteMany({
      where: { businessId }
    })

    // Reset customer points and visits
    await db.customer.updateMany({
      where: { businessId },
      data: {
        totalPoints: 0,
        totalVisits: 0,
        lastCheckIn: null,
      }
    })

    return NextResponse.json({ success: true, message: 'Historial de transacciones borrado' })
  } catch (error: any) {
    console.error('Clear transactions error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}