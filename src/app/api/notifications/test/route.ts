import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendTelegramMessage } from '@/lib/telegram-notify'
import { sendEmailNotification, createGmailTransporter } from '@/lib/email-notify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channel } = body

    // Get auth from header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify admin
    const admin = await db.admin.findFirst({
      where: { token },
      include: { business: true }
    })

    if (!admin || !admin.business) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const business = admin.business

    if (channel === 'telegram') {
      if (!business.telegramEnabled || !business.telegramChatId) {
        return NextResponse.json({ success: false, error: 'Telegram no configurado' })
      }

      const testMessage = `🔔 *Prueba de RewardPoints*\\n\\nHola ${business.name},\\n¡Las notificaciones de Telegram están funcionando! ✅`

      const result = await sendTelegramMessage({
        user: business.telegramChatId,
        text: testMessage,
        apiKey: business.telegramBotToken || undefined
      })

      if (result.success) {
        return NextResponse.json({ success: true, messageId: result.messageId })
      } else {
        return NextResponse.json({ success: false, error: result.error })
      }
    }

    if (channel === 'email') {
      if (!business.smtpEnabled || !business.smtpUser || !business.smtpPassword) {
        return NextResponse.json({ success: false, error: 'SMTP no configurado' })
      }

      const result = await sendEmailNotification(
        {
          smtpHost: business.smtpHost,
          smtpPort: business.smtpPort,
          smtpUser: business.smtpUser,
          smtpPassword: business.smtpPassword,
          smtpFrom: business.smtpFrom,
        },
        {
          to: business.smtpUser,
          subject: '🔔 Prueba de RewardPoints',
          text: `Hola ${business.name}, las notificaciones de email están funcionando!`,
          html: `<p>Hola ${business.name}, las notificaciones de email están funcionando! ✅</p>`,
        }
      )

      if (result.success) {
        return NextResponse.json({ success: true, messageId: result.messageId })
      } else {
        return NextResponse.json({ success: false, error: result.error })
      }
    }

    return NextResponse.json({ error: 'Canal no soportado' }, { status: 400 })
  } catch (error: any) {
    console.error('Test notification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}