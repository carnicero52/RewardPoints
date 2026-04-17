import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    const admin = await db.admin.findFirst({
      where: { token },
      include: { business: true }
    })

    if (!admin || !admin.business) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const businessId = admin.business.id

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