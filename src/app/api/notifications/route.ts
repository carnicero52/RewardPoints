import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)
    const body = await request.json()
    const { type, title, message, channel, customerIds } = body

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Title and message required' }, { status: 400 })
    }

    // If no specific customers, send to all active customers
    let targetCustomerIds = customerIds

    if (!targetCustomerIds || targetCustomerIds.length === 0) {
      const allCustomers = await db.customer.findMany({
        where: { businessId, active: true },
        select: { id: true },
      })
      targetCustomerIds = allCustomers.map(c => c.id)
    }

    // Create notifications for each customer
    const notifications = await Promise.all(
      targetCustomerIds.map(customerId =>
        db.notification.create({
          data: {
            businessId,
            customerId,
            type: type || 'marketing',
            title: title.trim(),
            message: message.trim(),
            channel: channel || 'email',
            status: 'pending',
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      sent: notifications.length,
      message: `${notifications.length} notificaciones creadas`,
    })
  } catch (error: any) {
    console.error('Notifications POST error:', error)
    return NextResponse.json({ error: 'Error sending notifications' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = { businessId }
    if (status) where.status = status

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        customer: { select: { name: true } },
      },
    })

    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ error: 'Error fetching notifications' }, { status: 500 })
  }
}