'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Save, Palette, Gift, Bell, QrCode, Link } from 'lucide-react'

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('royalty_token')}`,
})

export function SettingsView() {
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const [form, setForm] = useState({
    // General
    name: '',
    slug: '',
    logo: '',
    brandColor: '#6366f1',
    description: '',
    // Points
    pointsPerPurchase: 1,
    pointsForReward: 10,
    rewardDescription: '',
    // Notifications
    email: '',
    phone: '',
    smtpEnabled: false,
    smtpHost: '',
    smtpPort: 465,
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
    telegramEnabled: false,
    telegramBotToken: '',
    telegramChatId: '',
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
          pointsPerPurchase: data.pointsPerPurchase || 1,
          pointsForReward: data.pointsForReward || 10,
          rewardDescription: data.rewardDescription || '',
          email: data.email || '',
          phone: data.phone || '',
          smtpEnabled: data.smtpEnabled || false,
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort || 465,
          smtpUser: data.smtpUser || '',
          smtpPassword: data.smtpPassword || '',
          smtpFrom: data.smtpFrom || '',
          telegramEnabled: data.telegramEnabled || false,
          telegramBotToken: data.telegramBotToken || '',
          telegramChatId: data.telegramChatId || '',
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
                  <Label>Puntos por cada compra/visita</Label>
                  <Input 
                    type="number"
                    value={form.pointsPerPurchase}
                    onChange={(e) => setForm({ ...form, pointsPerPurchase: parseInt(e.target.value) })}
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Puntos que gana el cliente por cada visita
                  </p>
                </div>
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
                  id="smtpEnabled"
                  checked={form.smtpEnabled}
                  onChange={(e) => setForm({ ...form, smtpEnabled: e.target.checked })}
                />
                <Label htmlFor="smtpEnabled">Habilitar emails</Label>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR TAB */}
        <TabsContent value="qr" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Código QR Público</CardTitle>
              <CardDescription> QR que escanean tus clientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <QrCode className="h-32 w-32 mx-auto text-gray-400" />
                <p className="mt-4 text-muted-foreground">
                  Tu código QR se generará automáticamente
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  URL: {typeof window !== 'undefined' ? window.location.origin : ''}/checkin?qr={form.slug}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Comparte este enlace con tus clientes:</p>
                <code className="block bg-gray-100 p-2 rounded mt-2 break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/checkin?qr={form.slug}
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}