import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendTelegramMessage } from '@/lib/telegram-notify'
import { sendEmailNotification } from '@/lib/email-notify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channel, phone } = body

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

    const business = admin.business

    // Telegram Bot (direct)
    if (channel === 'telegram') {
      if (!business.telegramEnabled || !business.telegramChatId) {
        return NextResponse.json({ success: false, error: 'Telegram no configurado' })
      }

      const testMessage = `🔔 *Prueba de RewardPoints*\n\nHola ${business.name},\n¡Las notificaciones de Telegram están funcionando! ✅`

      const result = await sendTelegramMessage({
        user: business.telegramChatId,
        text: testMessage,
        apiKey: business.telegramBotToken || undefined
      })

      return NextResponse.json({ success: result.success, messageId: result.messageId, error: result.error })
    }

    // Callmebot (Telegram)
    if (channel === 'callmebot') {
      if (!process.env.CALLMEBOT_API_KEY) {
        return NextResponse.json({ success: false, error: 'CALLMEBOT_API_KEY no configurada' })
      }

      const testPhone = phone || business.phone
      if (!testPhone) {
        return NextResponse.json({ success: false, error: 'Necesitas un número de teléfono' })
      }

      const testMessage = `🔔 *Prueba RewardPoints*\n\n${business.name}: Notificaciones de Callmebot funcionando! ✅`

      const result = await sendTelegramMessage({
        user: testPhone,
        text: testMessage,
        apiKey: process.env.CALLMEBOT_API_KEY
      })

      return NextResponse.json({ success: result.success, messageId: result.messageId, error: result.error })
    }

    // Callmebot WhatsApp
    if (channel === 'whatsapp') {
      if (!process.env.CALLMEBOT_API_KEY) {
        return NextResponse.json({ success: false, error: 'CALLMEBOT_API_KEY no configurada' })
      }

      const testPhone = phone || business.phone
      if (!testPhone) {
        return NextResponse.json({ success: false, error: 'Necesitas un número de teléfono' })
      }

      const testMessage = `🔔 *Prueba RewardPoints*\n\n${business.name}: Notificaciones de WhatsApp funcionando! ✅`

      const result = await sendTelegramMessage({
        user: testPhone,
        text: testMessage,
        apiKey: process.env.CALLMEBOT_API_KEY,
        isWhatsApp: true
      })

      return NextResponse.json({ success: result.success, messageId: result.messageId, error: result.error })
    }

    // Email/SMTP
    if (channel === 'email') {
      if (!business.smtpEnabled || !business.smtpUser || !business.smtpPassword) {
        return NextResponse.json({ success: false, error: 'SMTP no configurado' })
      }

      const testMessage = `🔔 Prueba de RewardPoints\n\nHola ${business.name},\n¡Las notificaciones por email están funcionando! ✅`

      const result = await sendEmailNotification(
        { smtpHost: business.smtpHost, smtpPort: business.smtpPort, smtpUser: business.smtpUser, smtpPassword: business.smtpPassword, smtpFrom: business.smtpFrom },
        { to: business.smtpUser!, subject: '🔔 Prueba de RewardPoints', text: testMessage, html: `<p>${testMessage}</p>` }
      )

      return NextResponse.json({ success: result.success, messageId: result.messageId, error: result.error })
    }

    return NextResponse.json({ error: 'Canal no soportado' }, { status: 400 })
  } catch (error: any) {
    console.error('Test notification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}