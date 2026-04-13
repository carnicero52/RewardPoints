import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 })
    }

    const qrCode = await db.qRCode.findFirst({
      where: {
        code,
        active: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        business: { select: { id: true, name: true, brandColor: true } },
      },
    })

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code invalid or expired' }, { status: 400 })
    }

    return NextResponse.json({
      business: qrCode.business,
      qrCodeId: qrCode.id,
    })
  } catch (error: any) {
    console.error('Verify QR error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}