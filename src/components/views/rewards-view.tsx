'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Reward {
  id: string
  name: string
  description: string | null
  pointsNeeded: number
  active: boolean
}

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('royalty_token')}`,
})

export function RewardsView() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', pointsNeeded: '10' })

  useEffect(() => {
    fetch('/api/rewards', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setRewards(data))
      .catch(err => toast.error('Error loading rewards'))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    if (!form.name || !form.pointsNeeded) {
      toast.error('Completa los campos requeridos')
      return
    }

    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          pointsNeeded: parseInt(form.pointsNeeded),
        }),
      })

      if (!res.ok) throw new Error('Error creating reward')

      toast.success('Premio creado')
      setShowAdd(false)
      setForm({ name: '', description: '', pointsNeeded: '10' })
      
      const updated = await fetch('/api/rewards', { headers: authHeaders() })
      setRewards(await updated.json())
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Premios</h1>
        <Button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancelar' : '+ Nuevo Premio'}
        </Button>
      </div>

      {showAdd && (
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm">Nombre del premio</label>
              <Input 
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Descuento 20%"
              />
            </div>
            <div>
              <label className="text-sm">Descripción</label>
              <Input 
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm">Puntos necesarios</label>
              <Input 
                type="number"
                value={form.pointsNeeded}
                onChange={(e) => setForm({ ...form, pointsNeeded: e.target.value })}
              />
            </div>
            <Button onClick={handleAdd}>Crear Premio</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <p>Cargando...</p>
        ) : rewards.length === 0 ? (
          <p className="text-muted-foreground">No hay premios configurados</p>
        ) : (
          rewards.map(reward => (
            <Card key={reward.id} className={!reward.active ? 'opacity-50' : ''}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-lg">{reward.name}</p>
                    <p className="text-sm text-muted-foreground">{reward.description}</p>
                  </div>
                  <Badge className="text-lg px-3 py-1">
                    {reward.pointsNeeded} pts
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}