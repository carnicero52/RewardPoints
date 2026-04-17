import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/auth'
import { notifyCustomer } from '@/lib/telegram-notify'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)
    const body = await request.json()
    const { type, title, message, channel, customerIds, scheduledAt, customerFilter, apiKey } = body

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Title and message required' }, { status: 400 })
    }

    // Get Callmebot API key from env or request
    const callmebotApiKey = apiKey || process.env.CALLMEBOT_API_KEY

    // If no specific customers, send to all active customers
    let targetCustomerIds = customerIds

    if (!targetCustomerIds || targetCustomerIds.length === 0) {
      const allCustomers = await db.customer.findMany({
        where: { businessId, active: true },
        select: { id: true },
      })
      targetCustomerIds = allCustomers.map(c => c.id)
    }

    // If scheduled, set status to 'scheduled' instead of 'pending'
    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date()
    const status = isScheduled ? 'scheduled' : 'pending'

    // Determine which channels to use
    const useEmail = !channel || channel === 'all' || channel === 'email'
    const useTelegram = channel === 'all' || channel === 'telegram'
    const useCallmebot = channel === 'all' || channel === 'callmebot'

    // Create database notifications and optionally send Telegram
    const notifications: any[] = []
    const telegramResults: { customerId: string; success: boolean; channels: string[] }[] = []

    for (const customerId of targetCustomerIds) {
      // Get customer data for Telegram
      let customerData: { id: string; name: string; telegram?: string | null; callmebot?: string | null; phone?: string | null } | null = null
      if (useTelegram || useCallmebot) {
        customerData = await db.customer.findUnique({
          where: { id: customerId },
          select: { id: true, name: true, telegram: true, callmebot: true, phone: true },
        })
      }

      // Send Telegram/Callmebot notifications
      if ((useTelegram || useCallmebot) && customerData && (customerData.telegram || customerData.callmebot)) {
        const telegramResult = await notifyCustomer({
          customer: {
            telegram: useTelegram ? customerData.telegram : null,
            callmebot: useCallmebot ? customerData.callmebot : null,
            phone: customerData.phone,
          },
          title: title.trim(),
          message: message.trim(),
          callmebotApiKey: callmebotApiKey,
        })

        telegramResults.push({
          customerId,
          success: telegramResult.success,
          channels: telegramResult.channels,
        })
      }

      // Create database notification (always for email/marketing)
      if (useEmail) {
        const notification = await db.notification.create({
          data: {
            businessId,
            customerId,
            type: type || 'marketing',
            title: title.trim(),
            message: message.trim(),
            channel: channel || 'email',
            status,
            scheduledAt: isScheduled ? new Date(scheduledAt) : null,
          },
        })
        notifications.push(notification)
      }
    }

    const telegramSent = telegramResults.filter(r => r.success).length
    const telegramFailed = telegramResults.filter(r => !r.success).length

    const action = isScheduled ? 'programadas' : 'enviadas'
    let responseMessage = `${notifications.length} notificaciones ${action}`

    if (telegramSent > 0) {
      responseMessage += `, ${telegramSent} Telegram/WhatsApp`
    }

    return NextResponse.json({
      success: true,
      sent: notifications.length,
      telegramSent,
      telegramFailed,
      message: responseMessage,
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
    })

    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ error: 'Error fetching notifications' }, { status: 500 })
  }
}