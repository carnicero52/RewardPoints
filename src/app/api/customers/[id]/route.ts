import { getAuthPayload } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { businessId } = getAuthPayload(request)
    const body = await request.json()

    const customer = await db.customer.update({
      where: { id, businessId },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        telegram: body.telegram,
      }
    })

    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Update customer error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { businessId } = getAuthPayload(request)

    await db.customer.delete({
      where: { id, businessId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete customer error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}