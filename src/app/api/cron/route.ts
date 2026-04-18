import { db } from '@/lib/db'
import { sendTelegramMessage } from '@/lib/telegram-notify'
import { sendEmailNotification } from '@/lib/email-notify'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Cron API for scheduled notifications
 * 
 * Call examples:
 * - /api/cron?type=inactive&days=30 - Notify customers inactive for 30 days
 * - /api/cron?type=daily_summary - Send daily summary to admin
 * - /api/cron?type=hourly_check - Hourly check for new checkins
 * - /api/cron?type=test - Test notification
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'test'
    const secret = searchParams.get('secret')
    
    // Verify cron secret (set in Vercel env variables)
    const CRON_SECRET = process.env.CRON_SECRET
    if (CRON_SECRET && secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businesses = await db.business.findMany({
      where: {
        OR: [
          { telegramEnabled: true },
          { telegramChatId: { not: null } },
          { smtpEnabled: true },
        ]
      }
    })

    const results: any[] = []

    for (const business of businesses) {
      try {
        if (type === 'test') {
          const msg = `🔔 *Prueba RewardPoints*\n\n${business.name}: ¡Cron funcionando! ✅\nHora: ${new Date().toLocaleString()}`
          
          if (business.telegramEnabled && business.telegramChatId) {
            await sendTelegramMessage({
              user: business.telegramChatId,
              text: msg,
              apiKey: business.telegramBotToken || undefined
            })
          }
          results.push({ business: business.name, status: 'test sent' })
        }
        
        if (type === 'inactive') {
          const days = parseInt(searchParams.get('days') || '30')
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - days)
          
          const inactiveCustomers = await db.customer.findMany({
            where: {
              businessId: business.id,
              lastCheckIn: { lt: cutoffDate }
            }
          })
          
          if (inactiveCustomers.length > 0 && business.telegramEnabled && business.telegramChatId) {
            const msg = `😢 *Clientes Inactivos*\n\n${business.name}: ${inactiveCustomers.length} cliente(s) inactivo(s) hace ${days} días.\n\n${inactiveCustomers.slice(0, 5).map(c => `• ${c.name}`).join('\n')}`
            
            await sendTelegramMessage({
              user: business.telegramChatId,
              text: msg,
              apiKey: business.telegramBotToken || undefined
            })
          }
          results.push({ business: business.name, inactive: inactiveCustomers.length })
        }
        
        if (type === 'daily_summary') {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          
          const todayTransactions = await db.transaction.count({
            where: {
              businessId: business.id,
              createdAt: { gte: today, lt: tomorrow }
            }
          })
          
          if (business.telegramEnabled && business.telegramChatId) {
            const msg = `📊 *Resumen Diario*\n\n${business.name}\n\n✅ Visitas hoy: ${todayTransactions}`
            
            await sendTelegramMessage({
              user: business.telegramChatId,
              text: msg,
              apiKey: business.telegramBotToken || undefined
            })
          }
          results.push({ business: business.name, transactions: todayTransactions })
        }
      } catch (err: any) {
        results.push({ business: business.name, error: err.message })
      }
    }

    return NextResponse.json({ 
      success: true, 
      type,
      businesses: results.length,
      results 
    })
  } catch (error: any) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}