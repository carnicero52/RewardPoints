'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Building2, Users, Gift, Key, CheckCircle, XCircle, Shield, Clock, Image } from 'lucide-react'

interface Business {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  pointsPerFrequency: number
  frequency: number
  pointsForReward: number
  rewardDescription: string | null
  rewardImageUrl: string | null
  cooldownHours: number
  maxDailyCheckIns: number
  active: boolean
  createdAt: string
}

interface Stats {
  totalBusinesses: number
  activeBusinesses: number
  totalCustomers: number
}

interface DetailedBusiness extends Business {
  customersCount: number
  transactionsCount: number
  rewardsRedeemed: number
}

export default function SuperAdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [businesses, setBusinesses] = useState<DetailedBusiness[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [viewBusiness, setViewBusiness] = useState<DetailedBusiness | null>(null)

  const superUrl = (path = '') => `/api/superadmin/businesses${path}?secret=${encodeURIComponent(secret)}`

  const login = async () => {
    if (!secret.trim()) {
      toast.error('Ingresa la clave de superadmin')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(superUrl(), {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) throw new Error('Clave incorrecta')

      const data = await res.json()
      setBusinesses(data.businesses || data)
      setStats(data.stats || null)
      setAuthed(true)
    } catch (error: any) {
      toast.error(error.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  const toggleBusiness = async (businessId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/superadmin/businesses/${businessId}?secret=${encodeURIComponent(secret)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })

      if (!res.ok) throw new Error('Error updating')

      toast.success(currentActive ? 'Negocio desactivado' : 'Negocio activado')
      
      // Refresh list
      const updated = await fetch(`/api/superadmin/businesses?secret=${encodeURIComponent(secret)}`, {
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await updated.json()
      setBusinesses(data.businesses || data)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Key className="h-12 w-12 mx-auto text-pink-600 mb-4" />
            <CardTitle className="text-2xl">Super Admin</CardTitle>
            <p className="text-sm text-muted-foreground">RewardPoints</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Clave de superadmin"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
              />
            </div>
            <Button className="w-full" onClick={login} disabled={loading}>
              {loading ? 'Verificando...' : 'Acceder'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Panel Super Admin</h1>
            <p className="text-purple-200">Gestión de RewardPoints</p>
          </div>
          <Button variant="outline" onClick={() => setAuthed(false)}>
            Cerrar sesión
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4 flex items-center gap-4">
                <Building2 className="h-8 w-8 text-pink-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalBusinesses}</p>
                  <p className="text-purple-200 text-sm">Total negocios</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4 flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.activeBusinesses}</p>
                  <p className="text-purple-200 text-sm">Negocios activos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4 flex items-center gap-4">
                <Users className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalCustomers}</p>
                  <p className="text-purple-200 text-sm">Total clientes</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Businesses List */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Negocios registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {businesses.length === 0 ? (
                <p className="text-purple-200 text-center py-8">No hay negocios registrados</p>
              ) : (
                businesses.map((business) => (
                  <div 
                    key={business.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{business.name}</p>
                        <Badge variant={business.active ? 'default' : 'secondary'}>
                          {business.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <p className="text-purple-200 text-sm">{business.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Gift className="h-3 w-3 mr-1" />
                          {business.pointsForReward} pts para premio
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {business.cooldownHours}h cooldown
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          {business.maxDailyCheckIns}/día
                        </Badge>
                        {business.rewardImageUrl && (
                          <Badge variant="outline" className="text-xs">
                            <Image className="h-3 w-3 mr-1" />
                            Imagen
                          </Badge>
                        )}
                      </div>
                      <p className="text-purple-300 text-xs mt-1">
                        {business.customersCount || 0} clientes • {business.transactionsCount || 0} transacciones
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewBusiness(business)}
                      >
                        Ver detalles
                      </Button>
                      <Button
                        size="sm"
                        variant={business.active ? 'destructive' : 'default'}
                        onClick={() => toggleBusiness(business.id, business.active)}
                      >
                        {business.active ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Detail Modal */}
        {viewBusiness && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{viewBusiness.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{viewBusiness.email}</p>
                </div>
                <Button variant="ghost" onClick={() => setViewBusiness(null)}>✕</Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="config">
                  <TabsList className="w-full">
                    <TabsTrigger value="config">Configuración</TabsTrigger>
                    <TabsTrigger value="stats">Estadísticas</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="config" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Puntos por frecuencia</Label>
                        <p className="text-lg font-semibold">{viewBusiness.pointsPerFrequency}</p>
                      </div>
                      <div>
                        <Label>Frecuencia (visitas)</Label>
                        <p className="text-lg font-semibold">{viewBusiness.frequency}</p>
                      </div>
                      <div>
                        <Label>Puntos para premio</Label>
                        <p className="text-lg font-semibold">{viewBusiness.pointsForReward}</p>
                      </div>
                      <div>
                        <Label>Premio</Label>
                        <p className="text-lg font-semibold">{viewBusiness.rewardDescription || 'Sin configurar'}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">🔒 Anti-trampas</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Cooldown (horas)</Label>
                          <p className="text-lg font-semibold">{viewBusiness.cooldownHours}h</p>
                        </div>
                        <div>
                          <Label>Máx daily check-ins</Label>
                          <p className="text-lg font-semibold">{viewBusiness.maxDailyCheckIns}</p>
                        </div>
                      </div>
                    </div>

                    {viewBusiness.rewardImageUrl && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Imagen del premio</h4>
                        <img 
                          src={viewBusiness.rewardImageUrl} 
                          alt="Premio" 
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="stats" className="space-y-4 mt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-muted p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold">{viewBusiness.customersCount || 0}</p>
                        <p className="text-sm text-muted-foreground">Clientes</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold">{viewBusiness.transactionsCount || 0}</p>
                        <p className="text-sm text-muted-foreground">Transacciones</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold">{viewBusiness.rewardsRedeemed || 0}</p>
                        <p className="text-sm text-muted-foreground">Premios canjeados</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}