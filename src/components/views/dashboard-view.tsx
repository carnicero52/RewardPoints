'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Gift, ShoppingCart, TrendingUp } from 'lucide-react'
import { useAppStore } from '@/store/app-store'

const authHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('royalty_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface Stats {
  totalCustomers: number
  totalTransactions: number
  activeRewards: number
  totalPointsGiven: number
}

export function DashboardView() {
  const { user, businessName, navigate } = useAppStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/business/stats', { headers: authHeaders() })
        if (res.ok) {
          setStats(await res.json())
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">{businessName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCustomers ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Clientes registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTransactions ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Total de visitas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Premios</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeRewards ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Premios activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Puntos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPointsGiven ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Puntos otorgados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button className="h-20 text-lg" onClick={() => navigate('customers')}>
          <Users className="mr-2 h-5 w-5" />
          Clientes
        </Button>
        <Button className="h-20 text-lg" variant="outline" onClick={() => navigate('transactions')}>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Transacciones
        </Button>
        <Button className="h-20 text-lg" variant="secondary" onClick={() => navigate('rewards')}>
          <Gift className="mr-2 h-5 w-5" />
          Premios
        </Button>
      </div>
    </div>
  )
}