/**
 * Telegram notification utility using Callmebot API
 * API format: https://api.callmebot.com/text.php?user=@username&text=message
 */

interface SendTelegramParams {
  /** Telegram username (without @) or phone number */
  user: string
  /** Message text to send */
  text: string
  /** Callmebot API key (from environment or per-business config) */
  apiKey?: string
  /** Whether to use WhatsApp API instead */
  isWhatsApp?: boolean
}

interface TelegramMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send a message via Callmebot Telegram API
 */
export async function sendTelegramMessage(params: SendTelegramParams): Promise<TelegramMessageResult> {
  const { user, text, apiKey, isWhatsApp = false } = params

  if (!user) {
    return { success: false, error: 'Telegram username or phone required' }
  }

  // Build the API URL
  // Callmebot supports both Telegram and WhatsApp
  let apiUrl: string
  if (isWhatsApp) {
    // WhatsApp API format
    apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(user)}&text=${encodeURIComponent(text)}`
  } else {
    // Telegram API format - use username or phone
    // If it looks like a phone number (contains digits only), use phone parameter
    const isPhoneNumber = /^\+?[\d\s-]+$/.test(user)
    if (isPhoneNumber) {
      apiUrl = `https://api.callmebot.com/text.php?phone=${encodeURIComponent(user)}&text=${encodeURIComponent(text)}`
    } else {
      apiUrl = `https://api.callmebot.com/text.php?user=@${encodeURIComponent(user)}&text=${encodeURIComponent(text)}`
    }
  }

  // Add API key if provided
  if (apiKey) {
    apiUrl += `&apikey=${apiKey}`
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
    })

    const responseText = await response.text()

    // Callmebot returns "OK" or error messages
    if (response.ok && (responseText === 'OK' || responseText.includes('Message sent'))) {
      return { success: true, messageId: responseText }
    }

    // Parse error response
    if (responseText.includes('error') || responseText.includes('Error')) {
      return { success: false, error: responseText }
    }

    return { success: true, messageId: responseText }
  } catch (error: any) {
    console.error('Telegram notification error:', error)
    return { success: false, error: error.message || 'Failed to send telegram' }
  }
}

/**
 * Send notification to a customer via their preferred channel
 */
interface NotifyCustomerParams {
  customer: {
    telegram?: string | null
    callmebot?: string | null
    phone?: string | null
  }
  business?: {
    telegramBotToken?: string | null
    telegramChatId?: string | null
  }
  title: string
  message: string
  /** Optional API key for Callmebot */
  callmebotApiKey?: string
}

export async function notifyCustomer(params: NotifyCustomerParams): Promise<{ success: boolean; channels: string[]; errors: string[] }> {
  const { customer, business, title, message, callmebotApiKey } = params

  const successChannels: string[] = []
  const errors: string[] = []

  // Format message with title
  const fullMessage = `📢 *${title}*\n\n${message}`

  // Try Telegram first
  if (customer.telegram) {
    const result = await sendTelegramMessage({
      user: customer.telegram,
      text: fullMessage,
      apiKey: callmebotApiKey,
    })

    if (result.success) {
      successChannels.push('telegram')
    } else {
      errors.push(`Telegram: ${result.error}`)
    }
  }

  // Try Callmebot (WhatsApp)
  if (customer.callmebot) {
    const result = await sendTelegramMessage({
      user: customer.callmebot,
      text: fullMessage,
      apiKey: callmebotApiKey,
      isWhatsApp: true,
    })

    if (result.success) {
      successChannels.push('callmebot')
    } else {
      errors.push(`Callmebot: ${result.error}`)
    }
  }

  return {
    success: successChannels.length > 0,
    channels: successChannels,
    errors,
  }
}

/**
 * Build check-in notification message
 */
export function buildCheckInMessage(params: {
  customerName: string
  businessName: string
  pointsEarned: number
  totalPoints: number
  visitsUntilReward: number
  rewardDescription?: string | null
}): string {
  const { customerName, businessName, pointsEarned, totalPoints, visitsUntilReward, rewardDescription } = params

  let message = `✅ *${customerName}*, check-in exitoso en *${businessName}*`

  if (pointsEarned > 0) {
    message += `\n\n🎉 *Ganaste ${pointsEarned} punto(s)!*`
    message += `\n💰 Total: ${totalPoints} puntos`
  }

  if (visitsUntilReward > 0 && rewardDescription) {
    message += `\n\n⏳ Te faltan ${visitsUntilReward} visita(s) para tu ${rewardDescription}`
  } else if (visitsUntilReward === 0 && rewardDescription) {
    message += `\n\n🎊 *YA GANASTE TU ${rewardDescription.toUpperCase()}!*`
    message += `\n🎁 Canjea tu premio en el establecimiento`
  }

  return message
}

/**
 * Build reward available notification message
 */
export function buildRewardMessage(params: {
  customerName: string
  businessName: string
  rewardDescription: string
}): string {
  const { customerName, businessName, rewardDescription } = params

  return `🎉 *Felicitaciones ${customerName}!*\n\n🏆 ¡Has alcanzado las visitas necesarias en *${businessName}*!\n\n🎁 Tu premio: *${rewardDescription}*\n\n💙 Canjea tu premio en tu próxima visita`
}

/**
 * Build inactive customer reminder message
 */
export function buildInactiveMessage(params: {
  customerName: string
  businessName: string
  lastVisitDays: number
  visitsUntilReward: number
  rewardDescription?: string | null
}): string {
  const { customerName, businessName, lastVisitDays, visitsUntilReward, rewardDescription } = params

  let message = `👋 *Hola ${customerName}!*`

  if (lastVisitDays >= 30) {
    message += `\n\n😢 Te extrañamos en *${businessName}*`
    message += `\n📅 Han pasado ${lastVisitDays} días desde tu última visita`
  } else {
    message += `\n\n💙 ¡Te extrañamos en *${businessName}*!`
    message += `\n📅 Han pasado ${lastVisitDays} días desde tu última visita`
  }

  if (visitsUntilReward > 0 && rewardDescription) {
    message += `\n\n🎯 *Casi lo logras!*`
    message += `\nSolo te faltan ${visitsUntilReward} visita(s) para tu ${rewardDescription}`
  }

  message += `\n\n✨ ¡Te esperamos pronto!`

  return message
}