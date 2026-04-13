'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Send, Mail, MessageSquare } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
}

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('royalty_token')}`,
})

export function NotificationsView() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    type: 'marketing',
    title: '',
    message: '',
    channel: 'email',
    customerIds: [] as string[],
  })

  useEffect(() => {
    fetch('/api/customers', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setCustomers(data))
      .catch(err => toast.error('Error loading customers'))
      .finally(() => setLoading(false))
  }, [])

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Completa título y mensaje')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error('Error sending notifications')

      toast.success('Notificaciones enviadas')
      setForm({ ...form, title: '', message: '', customerIds: [] })
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSending(false)
    }
  }

  const toggleCustomer = (id: string) => {
    setForm(prev => ({
      ...prev,
      customerIds: prev.customerIds.includes(id)
        ? prev.customerIds.filter(c => c !== id)
        : [...prev.customerIds, id]
    }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Enviar Notificaciones</h1>

      <Card>
        <CardHeader>
          <CardTitle>Configurar mensaje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de notificación</Label>
              <select
                className="w-full p-2 border rounded"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="marketing">Marketing</option>
                <option value="collection">Cobranza</option>
                <option value="reminder">Recordatorio</option>
                <option value="system">Sistema</option>
              </select>
            </div>
            <div>
              <Label>Canal</Label>
              <select
                className="w-full p-2 border rounded"
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                <option value="email">Email</option>
                <option value="telegram">Telegram</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Título</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: ¡Nueva promoción!"
            />
          </div>

          <div>
            <Label>Mensaje</Label>
            <textarea
              className="w-full p-2 border rounded min-h-[100px]"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Escribe tu mensaje..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar clientes ({form.customerIds.length} seleccionados)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando...</p>
          ) : customers.length === 0 ? (
            <p className="text-muted-foreground">No hay clientes</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-auto">
              {customers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => toggleCustomer(customer.id)}
                  className={`p-2 text-left rounded border ${
                    form.customerIds.includes(customer.id)
                      ? 'bg-pink-100 border-pink-500'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <p className="font-medium text-sm truncate">{customer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{customer.email || customer.phone}</p>
                </button>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setForm(prev => ({ ...prev, customerIds: customers.map(c => c.id) }))}>
              Seleccionar todos
            </Button>
            <Button variant="outline" onClick={() => setForm(prev => ({ ...prev, customerIds: [] }))}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSend} 
        disabled={sending || form.customerIds.length === 0}
        className="w-full"
      >
        <Send className="h-4 w-4 mr-2" />
        {sending ? 'Enviando...' : `Enviar a ${form.customerIds.length} cliente(s)`}
      </Button>
    </div>
  )
}