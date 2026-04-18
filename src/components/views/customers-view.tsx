'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, User, Mail, Phone, MessageSquare } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  telegram?: string
  callmebot?: string
  totalPoints: number
  totalVisits: number
  createdAt: string
}

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('royalty_token')}`,
})

export function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    telegram: '',
    callmebot: '',
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = () => {
    fetch('/api/customers', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setCustomers(data))
      .catch(err => toast.error('Error loading customers'))
      .finally(() => setLoading(false))
  }

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setSaving(true)
    try {
      const isEdit = newCustomer.id
      const url = isEdit ? `/api/customers/${newCustomer.id}` : '/api/customers'
      const method = isEdit ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      })

      if (!res.ok) throw new Error('Error saving customer')

      toast.success(isEdit ? 'Cliente actualizado' : 'Cliente creado exitosamente')
      setShowAddModal(false)
      setNewCustomer({ name: '', email: '', phone: '', telegram: '', callmebot: '' })
      loadCustomers()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEditCustomer = (customer: any) => {
    setNewCustomer(customer)
    setShowAddModal(true)
  }

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('¿Estás seguro de borrar este cliente? Esta acción no se puede deshacer.')) return
    
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
      
      if (!res.ok) throw new Error('Error deleting customer')
      
      toast.success('Cliente borrado')
      loadCustomers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <Input 
        placeholder="Buscar cliente..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <div className="grid gap-4">
        {loading ? (
          <p>Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No hay clientes registrados</p>
        ) : (
          filtered.map(customer => (
            <Card key={customer.id} className="bg-gradient-to-r dark:from-purple-900/50 dark:to-indigo-900/50 from-gray-100 to-gray-200 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{customer.name}</p>
                      <div className="flex gap-3 text-sm text-purple-300">
                        {customer.email && <span>{customer.email}</span>}
                        {customer.phone && <span>{customer.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-purple-500/20 text-purple-300">
                      {customer.totalPoints} puntos
                    </Badge>
                    <p className="text-xs text-purple-400 mt-1">
                      {customer.totalVisits} visitas
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="h-7 text-xs"
                        onClick={() => handleDeleteCustomer(customer.id)}
                      >
                        Borrar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Customer Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-gray-900 border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-purple-200">Nombre completo *</Label>
              <Input 
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                placeholder="Juan Pérez"
                className="bg-gray-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-purple-200">Email</Label>
              <Input 
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                placeholder="juan@email.com"
                className="bg-gray-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-purple-200">Teléfono</Label>
              <Input 
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                placeholder="+58 412 1234567"
                className="bg-gray-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-purple-200">Telegram (opcional)</Label>
              <Input 
                value={newCustomer.telegram}
                onChange={(e) => setNewCustomer({...newCustomer, telegram: e.target.value})}
                placeholder="@username"
                className="bg-gray-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-purple-200">CallMeBot/WhatsApp (opcional)</Label>
              <Input 
                value={newCustomer.callmebot}
                onChange={(e) => setNewCustomer({...newCustomer, callmebot: e.target.value})}
                placeholder="+58 412 1234567"
                className="bg-gray-800 border-purple-500/30 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="border-purple-500/30 text-purple-200">
              Cancelar
            </Button>
            <Button onClick={handleAddCustomer} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? 'Guardando...' : 'Guardar Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}