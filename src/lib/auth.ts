import { NextRequest } from 'next/server'
import { verify, sign } from 'jsonwebtoken'

type AuthPayload = {
  userId: string
  businessId: string
  role: string
}

export function getAuthPayload(request: NextRequest): AuthPayload {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }

  const token = authHeader.slice(7)

  const decoded = verify(
    token,
    process.env.JWT_SECRET || 'royalty-qr-secret'
  ) as AuthPayload

  if (!decoded?.userId || !decoded?.businessId) {
    throw new Error('Unauthorized')
  }

  return decoded
}

export function generateToken(payload: AuthPayload): string {
  return sign(payload, process.env.JWT_SECRET || 'royalty-qr-secret', {
    expiresIn: '7d'
  })
}