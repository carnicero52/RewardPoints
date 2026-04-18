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
/**
 * Send welcome email to new customer
 */
export async function sendWelcomeEmail(
  business: any,
  customer: any,
  smtpConfig: any
) {
  const subject = `🎉 ¡Bienvenido a ${business.name}!`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">¡Bienvenido, ${customer.name}! 🎉</h1>
      <p>Te has registrado exitosamente en <strong>${business.name}</strong></p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h2 style="margin: 0 0 10px 0;">Tu estado actual:</h2>
        <p style="font-size: 24px; margin: 0;"><strong>${customer.totalPoints || 0}</strong> puntos</p>
        <p style="font-size: 24px; margin: 10px 0 0 0;"><strong>${customer.totalVisits || 0}</strong> visitas</p>
      </div>
      ${business.rewardDescription ? `
      <p>🎁 Premio: <strong>${business.rewardDescription}</strong></p>
      <p>Necesitas <strong>${business.pointsForReward - (customer.totalPoints || 0)}</strong> puntos más para canjearlo</p>
      ` : ''}
      <p style="margin-top: 30px;">¡Gracias por ser parte de nuestra familia!</p>
      <p>${business.name}</p>
    </div>
  `
  return sendEmailNotification(smtpConfig, {
    to: customer.email,
    subject,
    html,
    text: `Bienvenido a ${business.name}! Tienes ${customer.totalPoints || 0} puntos.`
  })
}

/**
 * Send check-in email with progress
 */
export async function sendCheckinProgressEmail(
  business: any,
  customer: any,
  pointsEarned: number,
  smtpConfig: any
) {
  const pointsForReward = business.pointsForReward || 10
  const currentPoints = customer.totalPoints || 0
  const remaining = Math.max(0, pointsForReward - currentPoints)
  
  const subject = `🛒 ¡Nueva visita en ${business.name}! +${pointsEarned} puntos`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">¡Gracias por tu visita, ${customer.name}! 🛒</h1>
      <p>Acabas de ganar <strong style="color: #10b981; font-size: 24px;">+${pointsEarned}</strong> puntos en <strong>${business.name}</strong></p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h2 style="margin: 0 0 10px 0;">📊 Tu progreso:</h2>
        <p style="font-size: 20px; margin: 0;"><strong>${currentPoints}</strong> puntos acumulados</p>
        <p style="font-size: 20px; margin: 10px 0 0 0;"><strong>${customer.totalVisits || 0}</strong> visitas</p>
      </div>
      
      ${remaining > 0 ? `
      <div style="background: #dbeafe; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <p style="margin: 0; font-size: 18px;">🎯 Solo te faltan <strong>${remaining}</strong> punto(s) para tu premio</p>
      </div>
      ` : `
      <div style="background: #d1fae5; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <p style="margin: 0; font-size: 20px; color: #059669;">🎉 ¡Ya puedes canjear tu premio!</p>
      </div>
      `}
      
      <p style="margin-top: 30px;">¡Nos vemos pronto!</p>
      <p>${business.name}</p>
    </div>
  `
  
  const text = `¡Nueva visita en ${business.name}! Ganaste +${pointsEarned} puntos. Total: ${currentPoints} puntos. ${remaining > 0 ? `Te faltan ${remaining} para tu premio.` : '¡Ya puedes canjear!'}`
  
  return sendEmailNotification(smtpConfig, {
    to: customer.email,
    subject,
    html,
    text
  })
}
