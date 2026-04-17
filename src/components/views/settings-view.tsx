'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import { Save, Palette, Gift, Bell, QrCode, Link, RefreshCw } from 'lucide-react'

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('royalty_token')}`,
})

export function SettingsView() {
  const { navigate } = useAppStore()
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('qr')

  const [form, setForm] = useState({
    // General
    name: '',
    slug: '',
    logo: '',
    brandColor: '#6366f1',
    description: '',
    // Points
    pointsPerFrequency: 1,
    frequency: 1,
    pointsForReward: 10,
    rewardDescription: '',
    rewardImageUrl: '',
    // Anti-cheat
    cooldownHours: 24,
    maxDailyCheckIns: 1,
    // Contact
    email: '',
    phone: '',
    // SMTP
    smtpEnabled: false,
    smtpHost: '',
    smtpPort: 465,
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
    // Email notifications
    emailEnabled: false,
    emailFrom: '',
    // Telegram
    telegramEnabled: false,
    telegramBotToken: '',
    telegramChatId: '',
    // Callmebot
    callmebotApiKey: '',
    callmebotPhone: '',
    // Notification preferences
    notifyOnCheckin: true,
    notifyOnReward: true,
    notifyOnInactive: false,
    customCheckinMessage: '',
    customRewardMessage: '',
  })

  useEffect(() => {
    fetch('/api/business', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => {
        setBusiness(data)
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          logo: data.logo || '',
          brandColor: data.brandColor || '#6366f1',
          description: data.description || '',
          pointsPerFrequency: data.pointsPerFrequency || 1,
          frequency: data.frequency || 1,
          pointsForReward: data.pointsForReward || 10,
          rewardDescription: data.rewardDescription || '',
          rewardImageUrl: data.rewardImageUrl || '',
          cooldownHours: data.cooldownHours || 24,
          maxDailyCheckIns: data.maxDailyCheckIns || 1,
          email: data.email || '',
          phone: data.phone || '',
          smtpEnabled: data.smtpEnabled || false,
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort || 465,
          smtpUser: data.smtpUser || '',
          smtpPassword: data.smtpPassword || '',
          smtpFrom: data.smtpFrom || '',
          emailEnabled: data.emailEnabled || false,
          emailFrom: data.emailFrom || '',
          telegramEnabled: data.telegramEnabled || false,
          telegramBotToken: data.telegramBotToken || '',
          telegramChatId: data.telegramChatId || '',
          callmebotApiKey: data.callmebotApiKey || '',
          callmebotPhone: data.callmebotPhone || '',
          notifyOnCheckin: data.notifyOnCheckin ?? true,
          notifyOnReward: data.notifyOnReward ?? true,
          notifyOnInactive: data.notifyOnInactive ?? false,
          customCheckinMessage: data.customCheckinMessage || '',
          customRewardMessage: data.customRewardMessage || '',
        })
      })
      .catch(err => toast.error('Error loading settings'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/business', {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error('Error saving')

      toast.success('Configuración guardada')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Cargando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <a href="#" onClick={(e) => { e.preventDefault(); useAppStore.getState().navigate("dashboard"); }} className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
              ← Volver al Dashboard
            </a>
          </div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Personaliza tu negocio</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="general">
            <Palette className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="points">
            <Gift className="h-4 w-4 mr-2" />
            Puntos
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="qr">
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </TabsTrigger>
        </TabsList>

        {/* GENERAL TAB */}
        <TabsContent value="general" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del negocio</CardTitle>
              <CardDescription> Datos básicos de tu negocio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre del negocio</Label>
                  <Input 
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Slug (URL)</Label>
                  <Input 
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="mi-negocio"
                  />
                </div>
              </div>
              <div>
                <Label>Logo (URL)</Label>
                <Input 
                  value={form.logo}
                  onChange={(e) => setForm({ ...form, logo: e.target.value })}
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Color de marca</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color"
                      value={form.brandColor}
                      onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                      className="w-12 h-10"
                    />
                    <Input 
                      value={form.brandColor}
                      onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Input 
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Email de contacto</Label>
                  <Input 
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input 
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POINTS TAB */}
        <TabsContent value="points" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Programa de puntos</CardTitle>
              <CardDescription> Configura cómo funcionan los puntos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Frecuencia de puntos (cada cuántas visitas)</Label>
                  <Input 
                    type="number"
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: parseInt(e.target.value) })}
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ej: 5 = 1 punto cada 5 visitas
                  </p>
                </div>
                <div>
                  <Label>Puntos a ganar por frecuencia</Label>
                  <Input 
                    type="number"
                    value={form.pointsPerFrequency}
                    onChange={(e) => setForm({ ...form, pointsPerFrequency: parseInt(e.target.value) })}
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Puntos ganados cada X visitas
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Puntos necesarios para premio</Label>
                  <Input 
                    type="number"
                    value={form.pointsForReward}
                    onChange={(e) => setForm({ ...form, pointsForReward: parseInt(e.target.value) })}
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Cuántos puntos necesita para canjear un premio
                  </p>
                </div>
              </div>
              <div>
                <Label>Descripción del premio (qué obtiene)</Label>
                <Input 
                  value={form.rewardDescription}
                  onChange={(e) => setForm({ ...form, rewardDescription: e.target.value })}
                  placeholder="Ej: Un café gratis, 20% de descuento, etc."
                />
              </div>
              <div>
                <Label>Imagen del premio (URL)</Label>
                <Input 
                  value={form.rewardImageUrl}
                  onChange={(e) => setForm({ ...form, rewardImageUrl: e.target.value })}
                  placeholder="https://ejemplo.com/imagen-premio.jpg"
                />
                {form.rewardImageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden bg-gray-800 max-w-xs">
                    <img src={form.rewardImageUrl} alt="Premio" className="w-full h-32 object-cover" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔒 Anti-trampas</CardTitle>
              <CardDescription> Configura límites para evitar abusos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Horas entre check-ins (cooldown)</Label>
                  <Input 
                    type="number"
                    value={form.cooldownHours}
                    onChange={(e) => setForm({ ...form, cooldownHours: parseInt(e.target.value) })}
                    min={0}
                    max={168}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    0 = sin límite, 24 = 1 check-in cada 24 horas
                  </p>
                </div>
                <div>
                  <Label>Check-ins máximos por día</Label>
                  <Input 
                    type="number"
                    value={form.maxDailyCheckIns}
                    onChange={(e) => setForm({ ...form, maxDailyCheckIns: parseInt(e.target.value) })}
                    min={1}
                    max={10}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Límite de check-ins en el mismo día
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email (SMTP)</CardTitle>
              <CardDescription> Configura el envío de emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="emailEnabled"
                  checked={form.emailEnabled}
                  onChange={(e) => setForm({ ...form, emailEnabled: e.target.checked })}
                />
                <Label htmlFor="emailEnabled">Habilitar notificaciones por email</Label>
              </div>
              {form.emailEnabled && (
                <>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="smtpEnabled"
                      checked={form.smtpEnabled}
                      onChange={(e) => setForm({ ...form, smtpEnabled: e.target.checked })}
                    />
                    <Label htmlFor="smtpEnabled">Usar SMTP personalizado</Label>
                  </div>
                  {form.smtpEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Servidor SMTP</Label>
                    <Input 
                      value={form.smtpHost}
                      onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <Label>Puerto</Label>
                    <Input 
                      type="number"
                      value={form.smtpPort}
                      onChange={(e) => setForm({ ...form, smtpPort: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Usuario SMTP</Label>
                    <Input 
                      value={form.smtpUser}
                      onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Contraseña SMTP</Label>
                    <Input 
                      type="password"
                      value={form.smtpPassword}
                      onChange={(e) => setForm({ ...form, smtpPassword: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Email remitente</Label>
                    <Input 
                      value={form.smtpFrom}
                      onChange={(e) => setForm({ ...form, smtpFrom: e.target.value })}
                      placeholder="noreply@tudominio.com"
                    />
                  </div>
                </div>
              )}
              {form.emailEnabled && form.smtpUser && form.smtpPassword && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/notifications/test', {
                        method: 'POST',
                        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                        body: JSON.stringify({ channel: 'email' })
                      })
                      const data = await res.json()
                      if (res.ok && data.success) toast.success('✅ Email de prueba enviado')
                      else toast.error(data.error || 'Error al enviar')
                    } catch (e) { toast.error('Error de conexión') }
                  }}
                >
                  Probar Conexión Email
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Telegram</CardTitle>
              <CardDescription> Configura el bot de Telegram</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="telegramEnabled"
                  checked={form.telegramEnabled}
                  onChange={(e) => setForm({ ...form, telegramEnabled: e.target.checked })}
                />
                <Label htmlFor="telegramEnabled">Habilitar Telegram</Label>
              </div>
              {form.telegramEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Bot Token</Label>
                    <Input 
                      value={form.telegramBotToken}
                      onChange={(e) => setForm({ ...form, telegramBotToken: e.target.value })}
                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    />
                  </div>
                  <div>
                    <Label>Chat ID</Label>
                    <Input 
                      value={form.telegramChatId}
                      onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
                      placeholder="-123456789"
                    />
                  </div>
                </div>
              )}
              {form.telegramEnabled && form.telegramChatId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/notifications/test', {
                        method: 'POST',
                        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                        body: JSON.stringify({ channel: 'telegram' })
                      })
                      const data = await res.json()
                      if (res.ok && data.success) toast.success('✅ Mensaje de prueba enviado')
                      else toast.error(data.error || 'Error al enviar')
                    } catch (e) { toast.error('Error de conexión') }
                  }}
                >
                  Probar Conexión
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Callmebot (Telegram) */}
          <Card>
            <CardHeader>
              <CardTitle>Callmebot (Telegram)</CardTitle>
              <CardDescription>Notificaciones via Callmebot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>API Key</Label>
                <Input
                  value={form.callmebotApiKey}
                  onChange={(e) => setForm({ ...form, callmebotApiKey: e.target.value })}
                  placeholder="Tu API key"
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={form.callmebotPhone}
                  onChange={(e) => setForm({ ...form, callmebotPhone: e.target.value })}
                  placeholder="+584121234567"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!form.callmebotApiKey || !form.callmebotPhone}
                onClick={async () => {
                  try {
                    const res = await fetch('/api/notifications/test', {
                      method: 'POST',
                      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                      body: JSON.stringify({ channel: 'callmebot', phone: form.callmebotPhone })
                    })
                    const data = await res.json()
                    if (res.ok && data.success) toast.success('✅ Prueba enviada')
                    else toast.error(data.error || 'Error')
                  } catch (e) { toast.error('Error') }
                }}
              >
                Probar Callmebot
              </Button>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <CardDescription> Selecciona qué eventos generan notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="notifyOnCheckin"
                  checked={form.notifyOnCheckin}
                  onChange={(e) => setForm({ ...form, notifyOnCheckin: e.target.checked })}
                />
                <Label htmlFor="notifyOnCheckin">Notificar cuando un cliente hace check-in</Label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="notifyOnReward"
                  checked={form.notifyOnReward}
                  onChange={(e) => setForm({ ...form, notifyOnReward: e.target.checked })}
                />
                <Label htmlFor="notifyOnReward">Notificar cuando un cliente canjea un premio</Label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="notifyOnInactive"
                  checked={form.notifyOnInactive}
                  onChange={(e) => setForm({ ...form, notifyOnInactive: e.target.checked })}
                />
                <Label htmlFor="notifyOnInactive">Notificar cuando un cliente está inactivo</Label>
              </div>
              <div className="border-t pt-4 mt-4">
                <Label className="mb-2 block">Mensaje personalizado de check-in</Label>
                <Input 
                  value={form.customCheckinMessage}
                  onChange={(e) => setForm({ ...form, customCheckinMessage: e.target.value })}
                  placeholder="¡Nuevo cliente! {name} acumuló {points} puntos"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variables: {'{name}'}, {'{points}'}, {'{totalPoints}'}, {'{visits}'}
                </p>
              </div>
              <div>
                <Label className="mb-2 block">Mensaje personalizado de recompensa</Label>
                <Input 
                  value={form.customRewardMessage}
                  onChange={(e) => setForm({ ...form, customRewardMessage: e.target.value })}
                  placeholder="¡{name} canjeó un premio!"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variables: {'{name}'}, {'{reward}'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR TAB */}
        <TabsContent value="qr" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Código QR Público</CardTitle>
              <CardDescription>QR que escanean tus clientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-8 rounded-lg text-center border-2 border-dashed border-gray-300">
                {form.slug ? (
                  <>
                    <QRCodeSVG 
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/checkin?qr=${form.slug}`}
                      size={200}
                      level="H"
                      includeMargin
                      className="mx-auto"
                    />
                    <p className="mt-4 text-sm text-muted-foreground font-mono break-all">
                      /checkin?qr={form.slug}
                    </p>
                  </>
                ) : (
                  <>
                    <QrCode className="h-32 w-32 mx-auto text-gray-400" />
                    <p className="mt-4 text-muted-foreground">
                      Configura el slug del negocio para generar el QR
                    </p>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const url = `${window.location.origin}/checkin?qr=${form.slug}`;
                    navigator.clipboard.writeText(url);
                    toast.success('URL copiada al portapapeles');
                  }}
                >
                  <Link className="h-4 w-4 mr-2" />
                  Copiar URL
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setForm({...form, slug: form.slug + '-' + Date.now()});
                    toast.success('QR regenerado');
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}