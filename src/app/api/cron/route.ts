import { db } from '@/lib/db'
import { sendTelegramMessage } from '@/lib/telegram-notify'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Cron API for scheduled notifications
 * No secret required if CRON_SECRET is not set in env
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'test'
    const secret = searchParams.get('secret')
    
    const CRON_SECRET = process.env.CRON_SECRET
    // Allow bypass if no CRON_SECRET is configured
    if (CRON_SECRET && CRON_SECRET.length > 0 && secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized - invalid secret or missing CRON_SECRET env' }, { status: 401 })
    }

    const businesses = await db.business.findMany({
      where: {
        OR: [
          { telegramEnabled: true },
          { telegramChatId: { not: null } },
        ]
      }
    })

    const results: any[] = []

    for (const business of businesses) {
      try {
        if (type === 'test') {
          const msg = `🔔 *Prueba RewardPoints*\n\n${business.name}: ¡Cron funcionando! ✅\nHora: ${new Date().toLocaleString()}`
          if (business.telegramEnabled && business.telegramChatId) {
            await sendTelegramMessage({ user: business.telegramChatId, text: msg, apiKey: business.telegramBotToken || undefined })
          }
          results.push({ business: business.name, status: 'test sent' })
        }
        
        if (type === 'inactive') {
          const days = parseInt(searchParams.get('days') || '30')
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - days)
          
          const inactiveCustomers = await db.customer.findMany({
            where: { businessId: business.id, lastCheckIn: { lt: cutoffDate } }
          })
          
          if (inactiveCustomers.length > 0 && business.telegramEnabled && business.telegramChatId) {
            const msg = `😢 *Clientes Inactivos*\n\n${business.name}: ${inactiveCustomers.length} cliente(s) inactivo(s) hace ${days} días.`
            await sendTelegramMessage({ user: business.telegramChatId, text: msg, apiKey: business.telegramBotToken || undefined })
          }
          results.push({ business: business.name, inactive: inactiveCustomers.length })
        }
        
        if (type === 'collections') {
          const customersWithDebt = await db.customer.findMany({
            where: { businessId: business.id, totalPoints: { gte: 100 } },
            select: { name: true, totalPoints: true }
          })
          
          if (customersWithDebt.length > 0 && business.telegramEnabled && business.telegramChatId) {
            const msg = `💰 *Cobranzas*\n\n${business.name}: ${customersWithDebt.length} cliente(s) con saldo pendiente.`
            await sendTelegramMessage({ user: business.telegramChatId, text: msg, apiKey: business.telegramBotToken || undefined })
          }
          results.push({ business: business.name, pending: customersWithDebt.length })
        }
        
        if (type === 'marketing') {
          const message = searchParams.get('message') || '¡Visita nuestro negocio!'
          const allCustomers = await db.customer.findMany({
            where: { businessId: business.id },
            select: { name: true, phone: true }
          })
          
          let sent = 0
          if (business.callmebotApiKey && allCustomers.length > 0) {
            for (const customer of allCustomers.slice(0, 50)) {
              if (customer.phone) {
                await sendTelegramMessage({
                  user: customer.phone,
                  text: `📢 *${business.name}*\n\n${message}`,
                  apiKey: business.callmebotApiKey,
                  isWhatsApp: true
                })
                sent++
              }
            }
          }
          results.push({ business: business.name, marketing_sent: sent })
        }
        
        if (type === 'daily_summary') {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          
          const todayTransactions = await db.transaction.count({
            where: { businessId: business.id, createdAt: { gte: today, lt: tomorrow } }
          })
          
          if (business.telegramEnabled && business.telegramChatId) {
            const msg = `📊 *Resumen*\n\n${business.name}\n\nVisitas hoy: ${todayTransactions}`
            await sendTelegramMessage({ user: business.telegramChatId, text: msg, apiKey: business.telegramBotToken || undefined })
          }
          results.push({ business: business.name, transactions: todayTransactions })
        }
      } catch (err: any) {
        results.push({ business: business.name, error: err.message })
      }
    }

    return NextResponse.json({ success: true, type, businesses: results.length, results })
  } catch (error: any) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
