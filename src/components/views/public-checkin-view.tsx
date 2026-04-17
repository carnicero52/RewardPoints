'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { QrCode, User, Gift, CheckCircle, Clock, Star, Zap } from 'lucide-react'

type Step = 'scan' | 'identify' | 'success'

type ProgressData = {
  current: number
  needed: number
  visitsUntilReward: number
  reward?: string | null
  rewardImage?: string | null
  pointsPerFrequency?: number
  frequency?: number
}

type BusinessData = {
  name: string
  logo?: string | null
  brandColor?: string
}

export function PublicCheckInView() {
  const [step, setStep] = useState<Step>('scan')
  const [businessName, setBusinessName] = useState('')
  const [businessLogo, setBusinessLogo] = useState('')
  const [brandColor, setBrandColor] = useState('#6366f1')
  const [qrCode, setQrCode] = useState('')
  const [identifyBy, setIdentifyBy] = useState<'phone' | 'email' | 'pin'>('phone')
  const [identifyValue, setIdentifyValue] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [currentPoints, setCurrentPoints] = useState(0)
  const [totalVisits, setTotalVisits] = useState(0)
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cooldownInfo, setCooldownInfo] = useState<{ hours: number; remaining: number } | null>(null)

  // Check for QR in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('qr')
    if (code) {
      setQrCode(code)
      verifyQR(code)
    }
  }, [])

  const verifyQR = async (code: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/public/checkin/verify?code=${code}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'QR inválido')
      }

      setBusinessName(data.business.name)
      setBusinessLogo(data.business.logo || '')
      setBrandColor(data.business.brandColor || '#6366f1')
      setStep('identify')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleIdentify = async () => {
    if (!identifyValue.trim()) {
      toast.error('Ingresa tu ' + identifyBy)
      return
    }

    setLoading(true)
    try {
      const payload: any = { qrCode, checkIn: false }
      if (identifyBy === 'phone') payload.phone = identifyValue.trim()
      else if (identifyBy === 'email') payload.email = identifyValue.trim()
      else payload.pin = identifyValue.trim()

      const res = await fetch('/api/public/checkin/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.needsRegistration) {
          setBusinessName(data.business.name)
          setBusinessLogo(data.business.logo || '')
          setBrandColor(data.business.brandColor || '#6366f1')
          setProgress(data.progress)
          setStep('identify')
          // Trigger registration flow
          toast.info('Regístrate para comenzar a acumular puntos')
          return
        }
        throw new Error(data.error || 'Cliente no encontrado')
      }

      setCustomerName(data.customer.name)
      setCustomerId(data.customer.id)
      setCurrentPoints(data.customer.totalPoints)
      setTotalVisits(data.customer.totalVisits)
      setProgress(data.progress)
      setStep('success')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!customerId) {
      toast.error('Primero identifica tu cuenta')
      return
    }

    setIsCheckingIn(true)
    try {
      const payload: any = { qrCode, checkIn: true }
      if (identifyBy === 'phone') payload.phone = identifyValue.trim()
      else if (identifyBy === 'email') payload.email = identifyValue.trim()
      else payload.pin = identifyValue.trim()

      const res = await fetch('/api/public/checkin/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          // Cooldown or daily limit
          const hoursRemaining = data.hoursSinceLastCheckIn 
            ? Math.ceil(data.cooldownHours - data.hoursSinceLastCheckIn)
            : 0
          setCooldownInfo({ hours: data.cooldownHours || 24, remaining: hoursRemaining })
          throw new Error(data.error)
        }
        throw new Error(data.error || 'Error al registrar check-in')
      }

      if (data.checkIn) {
        setCurrentPoints(data.customer.totalPoints)
        setTotalVisits(data.customer.totalVisits)
        setProgress(data.progress)
        
        if (data.checkIn.pointsEarned && data.checkIn.pointsEarned > 0) {
          toast.success(`🎉 ¡Ganaste ${data.checkIn.pointsEarned} punto(s)!`)
        } else {
          toast.success('✅ Check-in registrado')
        }
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleRegister = async () => {
    if (!identifyValue.trim()) {
      toast.error('Ingresa tu nombre')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/public/checkin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode,
          name: identifyValue.trim(),
          phone: identifyBy === 'phone' ? identifyValue.trim() : null,
          email: identifyBy === 'email' ? identifyValue.trim() : null,
          pin: identifyBy === 'pin' ? identifyValue.trim() : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar')
      }

      setCustomerName(data.customer.name)
      setCustomerId(data.customer.id)
      setCurrentPoints(data.customer.totalPoints)
      setTotalVisits(0)
      setStep('success')
      toast.success(`¡Registro exitoso, ${data.customer.name}!`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate progress percentage
  const progressPercent = progress 
    ? Math.min(100, ((progress.needed - progress.visitsUntilReward) / progress.needed) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-violet-800 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center text-white py-6">
          <div className="flex justify-center mb-4">
            {businessLogo ? (
              <img src={businessLogo} alt={businessName} className="h-16 w-16 rounded-full" />
            ) : (
              <div 
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${brandColor}30` }}
              >
                <QrCode className="h-8 w-8" style={{ color: brandColor }} />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold">RewardPoints</h1>
          {businessName && (
            <p className="text-purple-200">{businessName}</p>
          )}
        </div>

        {step === 'scan' && (
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <QrCode className="h-16 w-16 mx-auto text-purple-600" />
              <p className="text-muted-foreground">
                Escanea el código QR del negocio
              </p>
              <div className="space-y-2">
                <Input
                  placeholder="O ingresa el código manualmente"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && qrCode && verifyQR(qrCode)}
                />
                <Button 
                  className="w-full" 
                  onClick={() => qrCode && verifyQR(qrCode)}
                  disabled={!qrCode || loading}
                  style={{ backgroundColor: brandColor }}
                >
                  {loading ? 'Verificando...' : 'Verificar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'identify' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Identifícate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={identifyBy === 'phone' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setIdentifyBy('phone'); setIdentifyValue('') }}
                  style={identifyBy === 'phone' ? { backgroundColor: brandColor } : {}}
                >
                  Teléfono
                </Button>
                <Button
                  variant={identifyBy === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setIdentifyBy('email'); setIdentifyValue('') }}
                  style={identifyBy === 'email' ? { backgroundColor: brandColor } : {}}
                >
                  Email
                </Button>
                <Button
                  variant={identifyBy === 'pin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setIdentifyBy('pin'); setIdentifyValue('') }}
                  style={identifyBy === 'pin' ? { backgroundColor: brandColor } : {}}
                >
                  PIN
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder={
                    identifyBy === 'phone' ? 'Tu número de teléfono' :
                    identifyBy === 'email' ? 'Tu correo electrónico' :
                    'Tu PIN'
                  }
                  value={identifyValue}
                  onChange={(e) => setIdentifyValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleIdentify()}
                />
                <Button onClick={handleIdentify} disabled={loading} style={{ backgroundColor: brandColor }}>
                  {loading ? '...' : 'Entrar'}
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <button 
                  onClick={handleRegister}
                  className="underline hover:text-purple-600"
                  style={{ color: brandColor }}
                >
                  Regístrate aquí
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'success' && progress && (
          <div className="space-y-4">
            {/* Welcome Card */}
            <Card className="border-purple-500/50 bg-purple-500/10">
              <CardContent className="p-6 text-center space-y-4">
                <CheckCircle className="h-12 w-12 mx-auto text-purple-400" />
                <div>
                  <p className="text-xl font-bold text-white">{customerName}</p>
                  <p className="text-purple-200">¡Bienvenido de nuevo!</p>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-900/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-400">{currentPoints}</p>
                    <p className="text-xs text-purple-200">Puntos</p>
                  </div>
                  <div className="bg-purple-900/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-400">{totalVisits}</p>
                    <p className="text-xs text-purple-200">Visitas</p>
                  </div>
                </div>

                {/* Check-in Button */}
                <Button 
                  onClick={handleCheckIn}
                  disabled={isCheckingIn || !!cooldownInfo}
                  className="w-full text-lg py-6"
                  style={{ backgroundColor: brandColor }}
                >
                  {isCheckingIn ? (
                    'Registrando...'
                  ) : cooldownInfo ? (
                    <span className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Espera {cooldownInfo.remaining}h
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Registrar Visitay Ganar Puntos
                    </span>
                  )}
                </Button>

                {cooldownInfo && (
                  <p className="text-sm text-amber-400">
                    ⚠️ Debes esperar {cooldownInfo.remaining} hora(s) para otro check-in
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Progress Card */}
            <Card className="bg-gray-900/80 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  <Gift className="h-5 w-5 text-yellow-400" />
                  Tu Premio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Reward Image */}
                {progress.rewardImage && (
                  <div className="rounded-lg overflow-hidden bg-gray-800">
                    <img 
                      src={progress.rewardImage} 
                      alt={progress.reward || 'Premio'} 
                      className="w-full h-40 object-cover"
                    />
                  </div>
                )}

                {/* Reward Info */}
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">
                    {progress.reward || 'Premio Especial'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {progress.visitsUntilReward} visita(s) más para canjear
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progreso</span>
                    <span className="text-white">
                      {progress.needed - progress.visitsUntilReward} / {progress.needed} visitas
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                </div>

                {/* Frequency Info */}
                {progress.frequency && progress.frequency > 1 && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg p-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>Ganas 1 punto cada {progress.frequency} visitas</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Close Button */}
            <Button 
              variant="outline" 
              className="w-full border-purple-500 text-purple-200"
              onClick={() => {
                setStep('identify')
                setIdentifyValue('')
                setCustomerId('')
                setCooldownInfo(null)
              }}
            >
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}