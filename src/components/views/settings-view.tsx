'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('royalty_token')}`,
})

export function SettingsView() {
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    pointsPerPurchase: '1',
    pointsForReward: '10',
    rewardDescription: '',
    smtpEnabled: false,
    telegramEnabled: false,
  })

  useEffect(() => {
    fetch('/api/business', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => {
        setBusiness(data)
        setForm({
          name: data.name || '',
          pointsPerPurchase: String(data.pointsPerPurchase || 1),
          pointsForReward: String(data.pointsForReward || 10),
          rewardDescription: data.rewardDescription || '',
          smtpEnabled: data.smtpEnabled || false,
          telegramEnabled: data.telegramEnabled || false,
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
        body: JSON.stringify({
          name: form.name,
          pointsPerPurchase: parseInt(form.pointsPerPurchase),
          pointsForReward: parseInt(form.pointsForReward),
          rewardDescription: form.rewardDescription || null,
          smtpEnabled: form.smtpEnabled,
          telegramEnabled: form.telegramEnabled,
        }),
      })

      if (!res.ok) throw new Error('Error saving')

      toast.success('Configuración guardada')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Cargando...</p>

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <Card>
        <CardHeader>
          <CardTitle>Información del Negocio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nombre del Negocio</Label>
            <Input 
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programa de Puntos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Puntos por compra</Label>
            <Input 
              type="number"
              value={form.pointsPerPurchase}
              onChange={(e) => setForm({ ...form, pointsPerPurchase: e.target.value })}
            />
          </div>
          <div>
            <Label>Puntos para premio</Label>
            <Input 
              type="number"
              value={form.pointsForReward}
              onChange={(e) => setForm({ ...form, pointsForReward: e.target.value })}
            />
          </div>
          <div>
            <Label>Descripción del Premio</Label>
            <Input 
              value={form.rewardDescription}
              onChange={(e) => setForm({ ...form, rewardDescription: e.target.value })}
              placeholder="Ej: Un café gratis"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id="smtp"
              checked={form.smtpEnabled}
              onChange={(e) => setForm({ ...form, smtpEnabled: e.target.checked })}
            />
            <Label htmlFor="smtp">Habilitar Email (SMTP)</Label>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id="telegram"
              checked={form.telegramEnabled}
              onChange={(e) => setForm({ ...form, telegramEnabled: e.target.checked })}
            />
            <Label htmlFor="telegram">Habilitar Telegram</Label>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Guardando...' : 'Guardar Configuración'}
      </Button>
    </div>
  )
}