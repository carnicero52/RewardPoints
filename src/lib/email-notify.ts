import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string
  subject: string
  html?: string
  text?: string
}

export interface BusinessSMTPConfig {
  smtpHost?: string | null
  smtpPort?: number | null
  smtpUser?: string | null
  smtpPassword?: string | null
  smtpFrom?: string | null
}

/**
 * Create a nodemailer transporter from business SMTP config
 */
export function createTransporter(config: BusinessSMTPConfig) {
  if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) {
    throw new Error('SMTP configuration incomplete')
  }

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort || 465,
    secure: config.smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
  })
}

/**
 * Send email notification using business SMTP config
 */
export async function sendEmailNotification(
  config: BusinessSMTPConfig,
  options: EmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createTransporter(config)

    const result = await transporter.sendMail({
      from: config.smtpFrom || config.smtpUser,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    return {
      success: true,
      messageId: result.messageId,
    }
  } catch (error: any) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Gmail-specific helper for quick setup
 */
export function createGmailTransporter(email: string, appPassword: string) {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: email,
      pass: appPassword,
    },
  })
}

/**
 * Send notification email with template
 */
export async function sendCheckinNotification(
  config: BusinessSMTPConfig,
  to: string,
  customerName: string,
  points: number,
  totalPoints: number,
  visits: number,
  customMessage?: string | null
) {
  const defaultMessage = `¡Nueva visita! ${customerName} acumuló ${points} puntos. Total: ${totalPoints} puntos en ${visits} visitas.`
  const message = customMessage
    ?.replace('{name}', customerName)
    ?.replace('{points}', points.toString())
    ?.replace('{totalPoints}', totalPoints.toString())
    ?.replace('{visits}', visits.toString()) || defaultMessage

  return sendEmailNotification(config, {
    to,
    subject: '🔔 Nueva visita registrada',
    text: message,
    html: `<p>${message}</p>`,
  })
}

/**
 * Send reward redemption notification
 */
export async function sendRewardNotification(
  config: BusinessSMTPConfig,
  to: string,
  customerName: string,
  rewardName: string,
  customMessage?: string | null
) {
  const defaultMessage = `¡${customerName} canjeó: ${rewardName}!`
  const message = customMessage
    ?.replace('{name}', customerName)
    ?.replace('{reward}', rewardName) || defaultMessage

  return sendEmailNotification(config, {
    to,
    subject: '🎁 Premio canjeado',
    text: message,
    html: `<p>${message}</p>`,
  })
}