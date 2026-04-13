'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Transaction {
  id: string
  amount: number | null
  points: number
  notes: string | null
  status: string
  createdAt: string
  customer: { name: string }
}

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('royalty_token')}`,
})

export function TransactionsView() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ customerId: '', points: '1', notes: '' })

  useEffect(() => {
    fetch('/api/transactions', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(err => toast.error('Error loading transactions'))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    if (!form.customerId || !form.points) {
      toast.error('Completa los campos requeridos')
      return
    }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: form.customerId,
          points: parseInt(form.points),
          notes: form.notes || null,
        }),
      })

      if (!res.ok) throw new Error('Error creating transaction')

      toast.success('Transacción registrada')
      setShowAdd(false)
      setForm({ customerId: '', points: '1', notes: '' })
      
      // Refresh
      const updated = await fetch('/api/transactions', { headers: authHeaders() })
      setTransactions(await updated.json())
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Transacciones</h1>
        <Button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancelar' : '+ Nueva Transacción'}
        </Button>
      </div>

      {showAdd && (
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm">ID del Cliente</label>
              <Input 
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                placeholder="Ingresa el ID del cliente"
              />
            </div>
            <div>
              <label className="text-sm">Puntos</label>
              <Input 
                type="number"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm">Notas (opcional)</label>
              <Input 
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <Button onClick={handleAdd}>Registrar</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-3">
        {loading ? (
          <p>Cargando...</p>
        ) : transactions.length === 0 ? (
          <p className="text-muted-foreground">No hay transacciones</p>
        ) : (
          transactions.map(tx => (
            <Card key={tx.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{tx.customer?.name || 'Cliente'}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString('es')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">+{tx.points} pts</p>
                  <p className="text-xs text-muted-foreground">{tx.status}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}