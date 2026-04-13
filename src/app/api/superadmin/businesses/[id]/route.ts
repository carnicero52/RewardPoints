import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const SUPERADMIN_SECRET = process.env.SUPERADMIN_SECRET || 'superadmin-fideliqr-2026'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== SUPERADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { active } = body

    const business = await db.business.update({
      where: { id },
      data: { active },
    })

    return NextResponse.json(business)
  } catch (error: any) {
    console.error('Superadmin PUT error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}