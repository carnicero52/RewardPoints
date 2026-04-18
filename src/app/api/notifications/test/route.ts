import { getAuthPayload } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendTelegramMessage } from '@/lib/telegram-notify'
import { sendEmailNotification } from '@/lib/email-notify'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { businessId } = getAuthPayload(request)
    const body = await request.json()
    const { channel, phone } = body

    const business = await db.business.findUnique({
      where: { id: businessId }
    })

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

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
      if (!business.callmebotApiKey) {
        return NextResponse.json({ success: false, error: 'Callmebot API key no configurada' })
      }

      const testPhone = phone || business.phone
      if (!testPhone) {
        return NextResponse.json({ success: false, error: 'Número de teléfono no disponible' })
      }

      const testMessage = `🔔 *Prueba RewardPoints*\n\n${business.name}: Notificaciones de Callmebot funcionando! ✅`

      const result = await sendTelegramMessage({
        user: testPhone,
        text: testMessage,
        apiKey: business.callmebotApiKey
      })

      return NextResponse.json({ success: result.success, messageId: result.messageId, error: result.error })
    }

    // Callmebot WhatsApp
    if (channel === 'whatsapp') {
      if (!business.callmebotApiKey) {
        return NextResponse.json({ success: false, error: 'Callmebot API key no configurada' })
      }

      const testPhone = phone || business.phone
      if (!testPhone) {
        return NextResponse.json({ success: false, error: 'Número de teléfono no disponible' })
      }

      const testMessage = `🔔 *Prueba RewardPoints*\n\n${business.name}: Notificaciones de WhatsApp funcionando! ✅`

      const result = await sendTelegramMessage({
        user: testPhone,
        text: testMessage,
        apiKey: business.callmebotApiKey,
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