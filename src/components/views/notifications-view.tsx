'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Send, Mail, MessageSquare, Calendar, Users, Clock, SendHorizontal, UserX, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  telegram?: string
}

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('royalty_token')}`,
})

type NotificationType = 'marketing' | 'collection' | 'reminder' | 'promotion' | 'birthday' | 'inactive'
type Channel = 'email' | 'telegram' | 'callmebot' | 'all'

export function NotificationsView() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [customerFilter, setCustomerFilter] = useState<'all' | 'specific'>('all')
  
  const [form, setForm] = useState({
    // Notification content
    type: 'marketing' as NotificationType,
    title: '',
    message: '',
    channel: 'all' as Channel,
    
    // Scheduling
    scheduled: false,
    scheduleDate: '',
    scheduleTime: '',
    
    // Customer selection
    customerIds: [] as string[],
    customerFilter: 'all' as 'all' | 'specific',
    
    // Inactive customers
    inactiveDays: 30,
    sendToInactives: false,
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

    if (form.customerFilter === 'specific' && form.customerIds.length === 0) {
      toast.error('Selecciona al menos un cliente')
      return
    }

    if (form.scheduled && (!form.scheduleDate || !form.scheduleTime)) {
      toast.error('Configura fecha y hora programada')
      return
    }

    setSending(true)
    try {
      let endpoint = '/api/notifications'
      let method = 'POST'
      let payload: any = {
        ...form,
        // If scheduled, send the schedule datetime
        scheduledAt: form.scheduled ? `${form.scheduleDate}T${form.scheduleTime}:00` : null,
      }
      
      // If sending to inactive customers, use the send API
      if (form.sendToInactives) {
        endpoint = '/api/notifications/send'
        payload = {
          type: 'inactive',
          days: form.inactiveDays,
        }
      }
      
      const res = await fetch(endpoint, {
        method,
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Error sending notifications')

      const data = await res.json()

      if (form.sendToInactives) {
        toast.success(`Notificación enviada a ${data.sent || data.failed || 0} clientes inactivos`)
      } else if (form.scheduled) {
        toast.success(`Notificación programada para ${form.scheduleDate} a las ${form.scheduleTime}`)
      } else {
        const msg = data.telegramSent > 0 
          ? `Enviadas: ${data.sent} email, ${data.telegramSent} Telegram/WhatsApp`
          : `${data.sent || 0} notificaciones enviadas`
        toast.success(msg)
      }
      
      setForm({
        ...form,
        title: '',
        message: '',
        customerIds: [],
        scheduleDate: '',
        scheduleTime: '',
      })
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

  const selectAllCustomers = () => {
    setForm(prev => ({
      ...prev,
      customerIds: customers.map(c => c.id)
    }))
  }

  const clearAllCustomers = () => {
    setForm(prev => ({
      ...prev,
      customerIds: []
    }))
  }

  if (loading) return <div className="p-8 text-center">Cargando...</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Enviar Notificaciones</h1>
        <p className="text-muted-foreground">Crea y programa notificaciones para tus clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SendHorizontal className="h-5 w-5" />
              Mensaje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo de notificación</Label>
              <Select value={form.type} onValueChange={(v) => setForm({...form, type: v as NotificationType})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">📢 Marketing</SelectItem>
                  <SelectItem value="promotion">🔥 Promoción</SelectItem>
                  <SelectItem value="collection">💰 Cobranza</SelectItem>
                  <SelectItem value="reminder">⏰ Recordatorio</SelectItem>
                  <SelectItem value="birthday">🎂 Cumpleaños</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Título</Label>
              <Input 
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                placeholder="Ej: ¡Nueva promoción!"
              />
            </div>

            <div>
              <Label>Mensaje</Label>
              <Textarea 
                value={form.message}
                onChange={(e) => setForm({...form, message: e.target.value})}
                placeholder="Escribe tu mensaje..."
                rows={4}
              />
            </div>

            <div>
              <Label>Canal de envío</Label>
              <Select value={form.channel} onValueChange={(v) => setForm({...form, channel: v as Channel})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📨 Todos los disponibles</SelectItem>
                  <SelectItem value="email">📧 Solo Email</SelectItem>
                  <SelectItem value="telegram">✈️ Solo Telegram</SelectItem>
                  <SelectItem value="callmebot">💬 CallMeBot (WhatsApp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Programar
            </CardTitle>
            <CardDescription>Enviar ahora o en una fecha específica</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="scheduled"
                checked={form.scheduled}
                onCheckedChange={(v) => setForm({...form, scheduled: v === true})}
              />
              <Label htmlFor="scheduled">Programar envío</Label>
            </div>

            {form.scheduled && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <div>
                  <Label>Fecha</Label>
                  <Input 
                    type="date"
                    value={form.scheduleDate}
                    onChange={(e) => setForm({...form, scheduleDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label>Hora</Label>
                  <Input 
                    type="time"
                    value={form.scheduleTime}
                    onChange={(e) => setForm({...form, scheduleTime: e.target.value})}
                  />
                </div>
              </div>
            )}

            {!form.scheduled && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <Clock className="h-4 w-4 inline mr-1" />
                Se enviará inmediatamente al confirmar
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Destinatarios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant={customerFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setCustomerFilter('all')
                selectAllCustomers()
              }}
            >
              <Users className="h-4 w-4 mr-1" />
              Todos los clientes ({customers.length})
            </Button>
            <Button 
              variant={customerFilter === 'specific' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setCustomerFilter('specific')
                clearAllCustomers()
              }}
            >
              <Users className="h-4 w-4 mr-1" />
              Seleccionar específicos
            </Button>
          </div>

          {customerFilter === 'specific' && (
            <div className="border rounded-lg max-h-64 overflow-y-auto p-2 space-y-2">
              {customers.map(customer => (
                <div key={customer.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                  <Checkbox 
                    id={customer.id}
                    checked={form.customerIds.includes(customer.id)}
                    onCheckedChange={() => toggleCustomer(customer.id)}
                  />
                  <Label htmlFor={customer.id} className="flex-1 cursor-pointer">
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      {customer.email} {customer.phone && `| ${customer.phone}`}
                    </span>
                  </Label>
                </div>
              ))}
              {customers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No hay clientes registrados</p>
              )}
            </div>
          )}

          {customerFilter === 'all' && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              📢 Se notificará a todos los {customers.length} clientes
            </div>
          )}

          {customerFilter === 'specific' && form.customerIds.length > 0 && (
            <div className="text-sm text-muted-foreground">
              ✓ {form.customerIds.length} cliente(s) seleccionado(s)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Clientes Inactivos
          </CardTitle>
          <CardDescription>Notificar a clientes que no han visitado en X días</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="sendToInactives"
              checked={form.sendToInactives}
              onCheckedChange={(v) => setForm({...form, sendToInactives: v === true})}
            />
            <Label htmlFor="sendToInactives">Enviar a clientes inactivos</Label>
          </div>

          {form.sendToInactives && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
              <div>
                <Label>Días sin visita</Label>
                <Select 
                  value={form.inactiveDays.toString()} 
                  onValueChange={(v) => setForm({...form, inactiveDays: parseInt(v)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14">14 días</SelectItem>
                    <SelectItem value="21">21 días</SelectItem>
                    <SelectItem value="30">30 días</SelectItem>
                    <SelectItem value="45">45 días</SelectItem>
                    <SelectItem value="60">60 días</SelectItem>
                    <SelectItem value="90">90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm bg-muted p-3 rounded-lg">
                <Zap className="h-4 w-4 inline mr-1" />
                Se les enviará un recordatorio de regreso con su progreso hacia el premio
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Button */}
      <div className="flex justify-end gap-2">
        <Button 
          size="lg"
          onClick={handleSend}
          disabled={sending}
          variant={form.sendToInactives ? 'default' : 'default'}
        >
          {sending ? (
            <>Enviando...</>
          ) : form.sendToInactives ? (
            <>
              <UserX className="h-5 w-5 mr-2" />
              Notificar {form.inactiveDays}+ días sin visita
            </>
          ) : form.scheduled ? (
            <>
              <Calendar className="h-5 w-5 mr-2" />
              Programar notificación
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Enviar ahora
            </>
          )}
        </Button>
      </div>
    </div>
  )
}