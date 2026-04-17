import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/auth'
import { notifyCustomer, buildCheckInMessage, buildRewardMessage, buildInactiveMessage } from '@/lib/telegram-notify'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API route for sending notifications via Telegram/Callmebot
 * 
 * POST /api/notifications/send
 * Body: {
 *   type: 'checkin' | 'reward' | 'inactive' | 'custom'
 *   customerId?: string (for checkin, reward)
 *   title?: string (for custom)
 *   message?: string (for custom)
 *   customerIds?: string[] (for batch/custom)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)
    const body = await request.json()
    const { type, customerId, title, message, customerIds, apiKey } = body

    // Get Callmebot API key from env or request
    const callmebotApiKey = apiKey || process.env.CALLMEBOT_API_KEY

    // Get business config for notifications
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        rewardDescription: true,
        pointsForReward: true,
        telegramBotToken: true,
        telegramChatId: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    let results: { customerId: string; success: boolean; channels: string[]; error?: string }[] = []

    // Handle different notification types
    switch (type) {
      case 'checkin': {
        // Send check-in notification to a customer after they check in
        if (!customerId) {
          return NextResponse.json({ error: 'customerId requerido' }, { status: 400 })
        }

        const customer = await db.customer.findUnique({
          where: { id: customerId },
          select: {
            name: true,
            telegram: true,
            callmebot: true,
            phone: true,
            totalPoints: true,
            totalVisits: true,
          },
        })

        if (!customer) {
          return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
        }

        // Get points earned from the latest transaction (assumes it's just been created)
        const latestTransaction = await db.transaction.findFirst({
          where: { customerId, businessId },
          orderBy: { createdAt: 'desc' },
          select: { points: true },
        })

        const pointsEarned = latestTransaction?.points || 0
        const pointsForReward = business.pointsForReward || 10
        const currentPoints = customer.totalPoints
        const visitsUntilReward = Math.max(0, pointsForReward - customer.totalVisits)

        const notificationTitle = 'Check-in Confirmado'
        const notificationMessage = buildCheckInMessage({
          customerName: customer.name,
          businessName: business.name,
          pointsEarned,
          totalPoints: currentPoints,
          visitsUntilReward,
          rewardDescription: business.rewardDescription,
        })

        const result = await notifyCustomer({
          customer: {
            telegram: customer.telegram,
            callmebot: customer.callmebot,
            phone: customer.phone,
          },
          title: notificationTitle,
          message: notificationMessage,
          callmebotApiKey: callmebotApiKey,
        })

        results.push({
          customerId,
          success: result.success,
          channels: result.channels,
          error: result.errors.join(', '),
        })
        break
      }

      case 'reward': {
        // Notify customer that their reward is available
        if (!customerId) {
          return NextResponse.json({ error: 'customerId requerido' }, { status: 400 })
        }

        const customer = await db.customer.findUnique({
          where: { id: customerId },
          select: {
            name: true,
            telegram: true,
            callmebot: true,
            phone: true,
            totalVisits: true,
          },
        })

        if (!customer) {
          return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
        }

        const notificationTitle = '🎉 ¡Premio Disponible!'
        const notificationMessage = buildRewardMessage({
          customerName: customer.name,
          businessName: business.name,
          rewardDescription: business.rewardDescription || 'Premio Especial',
        })

        const result = await notifyCustomer({
          customer: {
            telegram: customer.telegram,
            callmebot: customer.callmebot,
            phone: customer.phone,
          },
          title: notificationTitle,
          message: notificationMessage,
          callmebotApiKey: callmebotApiKey,
        })

        results.push({
          customerId,
          success: result.success,
          channels: result.channels,
          error: result.errors.join(', '),
        })
        break
      }

      case 'inactive': {
        // Find customers with no visits in X days and notify them
        const days = body.days || 30
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)

        const inactiveCustomers = await db.customer.findMany({
          where: {
            businessId,
            active: true,
            OR: [
              { lastCheckIn: { lt: cutoffDate } },
              { lastCheckIn: null },
            ],
          },
          select: {
            id: true,
            name: true,
            telegram: true,
            callmebot: true,
            phone: true,
            lastCheckIn: true,
            totalVisits: true,
          },
        })

        const pointsForReward = business.pointsForReward || 10

        for (const customer of inactiveCustomers) {
          const lastVisitDays = customer.lastCheckIn
            ? Math.floor((Date.now() - new Date(customer.lastCheckIn).getTime()) / (1000 * 60 * 60 * 24))
            : days

          const visitsUntilReward = Math.max(0, pointsForReward - (customer.totalVisits || 0))

          const notificationTitle = '¡Te Extrañamos!'
          const notificationMessage = buildInactiveMessage({
            customerName: customer.name,
            businessName: business.name,
            lastVisitDays,
            visitsUntilReward,
            rewardDescription: business.rewardDescription,
          })

          const result = await notifyCustomer({
            customer: {
              telegram: customer.telegram,
              callmebot: customer.callmebot,
              phone: customer.phone,
            },
            title: notificationTitle,
            message: notificationMessage,
            callmebotApiKey: callmebotApiKey,
          })

          results.push({
            customerId: customer.id,
            success: result.success,
            channels: result.channels,
            error: result.errors.join(', '),
          })
        }
        break
      }

      case 'custom': {
        // Send custom notification to specific customers
        if (!title || !message) {
          return NextResponse.json({ error: 'Título y mensaje requeridos' }, { status: 400 })
        }

        const targetCustomerIds = customerIds || []

        if (targetCustomerIds.length === 0) {
          // Send to all active customers
          const allCustomers = await db.customer.findMany({
            where: { businessId, active: true },
            select: {
              id: true,
              name: true,
              telegram: true,
              callmebot: true,
              phone: true,
            },
          })

          for (const customer of allCustomers) {
            const result = await notifyCustomer({
              customer: {
                telegram: customer.telegram,
                callmebot: customer.callmebot,
                phone: customer.phone,
              },
              title,
              message,
              callmebotApiKey: callmebotApiKey,
            })

            results.push({
              customerId: customer.id,
              success: result.success,
              channels: result.channels,
              error: result.errors.join(', '),
            })
          }
        } else {
          // Send to specific customers
          for (const cid of targetCustomerIds) {
            const customer = await db.customer.findUnique({
              where: { id: cid },
              select: {
                name: true,
                telegram: true,
                callmebot: true,
                phone: true,
              },
            })

            if (customer) {
              const result = await notifyCustomer({
                customer: {
                  telegram: customer.telegram,
                  callmebot: customer.callmebot,
                  phone: customer.phone,
                },
                title,
                message,
                callmebotApiKey: callmebotApiKey,
              })

              results.push({
                customerId: cid,
                success: result.success,
                channels: result.channels,
                error: result.errors.join(', '),
              })
            }
          }
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Tipo de notificación inválido' }, { status: 400 })
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      results,
    })
  } catch (error: any) {
    console.error('Notifications send error:', error)
    return NextResponse.json({ error: 'Error al enviar notificaciones' }, { status: 500 })
  }
}

/**
 * GET - Check for inactive customers (for cron or admin review)
 */
export async function GET(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const inactiveCustomers = await db.customer.findMany({
      where: {
        businessId,
        active: true,
        OR: [
          { lastCheckIn: { lt: cutoffDate } },
          { lastCheckIn: null },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        telegram: true,
        callmebot: true,
        lastCheckIn: true,
        totalVisits: true,
        totalPoints: true,
      },
      orderBy: { lastCheckIn: 'asc' },
    })

    return NextResponse.json({
      days,
      count: inactiveCustomers.length,
      customers: inactiveCustomers,
    })
  } catch (error: any) {
    console.error('Inactive customers error:', error)
    return NextResponse.json({ error: 'Error al buscar clientes' }, { status: 500 })
  }
}