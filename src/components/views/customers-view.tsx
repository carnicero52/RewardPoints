'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
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

  useEffect(() => {
    fetch('/api/customers', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setCustomers(data))
      .catch(err => toast.error('Error loading customers'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Input 
          placeholder="Buscar cliente..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p>Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No hay clientes registrados</p>
        ) : (
          filtered.map(customer => (
            <Card key={customer.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.email || customer.phone || 'Sin contacto'}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {customer.totalPoints} pts
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {customer.totalVisits} visitas
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}