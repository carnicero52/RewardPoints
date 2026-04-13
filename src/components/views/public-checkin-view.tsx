'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { QrCode, User, Gift, CheckCircle } from 'lucide-react'

type Step = 'scan' | 'identify' | 'success'

export function PublicCheckInView() {
  const [step, setStep] = useState<Step>('scan')
  const [businessName, setBusinessName] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [identifyBy, setIdentifyBy] = useState<'phone' | 'email' | 'pin'>('phone')
  const [identifyValue, setIdentifyValue] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [currentPoints, setCurrentPoints] = useState(0)
  const [loading, setLoading] = useState(false)

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
      const payload: any = { qrCode: qrCode }
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
        throw new Error(data.error || 'Cliente no encontrado')
      }

      setCustomerName(data.customer.name)
      setCurrentPoints(data.customer.totalPoints)
      setStep('success')
      toast.success(`¡Bienvenido, ${data.customer.name}!`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
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
      setCurrentPoints(data.customer.totalPoints)
      setStep('success')
      toast.success(`¡Registro exitoso, ${data.customer.name}!`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-violet-800 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center text-white py-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-purple-500/20 flex items-center justify-center">
              <QrCode className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">FideliQR</h1>
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
                >
                  Teléfono
                </Button>
                <Button
                  variant={identifyBy === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setIdentifyBy('email'); setIdentifyValue('') }}
                >
                  Email
                </Button>
                <Button
                  variant={identifyBy === 'pin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setIdentifyBy('pin'); setIdentifyValue('') }}
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
                <Button onClick={handleIdentify} disabled={loading}>
                  {loading ? '...' : 'Entrar'}
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <button 
                  onClick={handleRegister}
                  className="text-purple-600 hover:underline"
                >
                  Regístrate aquí
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'success' && (
          <Card className="border-purple-500/50 bg-purple-500/10">
            <CardContent className="p-6 text-center space-y-4">
              <CheckCircle className="h-16 w-16 mx-auto text-purple-400" />
              <div>
                <p className="text-xl font-bold text-white">{customerName}</p>
                <p className="text-purple-200">¡Bienvenido de vuelta!</p>
              </div>
              <div className="bg-purple-900/50 rounded-lg p-4">
                <p className="text-sm text-purple-200">Tus puntos actuales</p>
                <p className="text-3xl font-bold text-purple-400">{currentPoints}</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-purple-500 text-purple-200"
                onClick={() => {
                  setStep('identify')
                  setIdentifyValue('')
                }}
              >
                Cerrar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}