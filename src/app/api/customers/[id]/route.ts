import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Delete customer
    await db.customer.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete customer error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}