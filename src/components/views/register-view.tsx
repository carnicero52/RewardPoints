'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

export function RegisterView() {
  const { navigate } = useAppStore()
  const [form, setForm] = useState({
    businessName: '',
    name: '',
    email: '',
    password: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      toast.success('Business registered! Please login.')
      navigate('login')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-violet-800 p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur border-purple-500/30">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Crear Negocio</CardTitle>
          <CardDescription className="text-purple-200">
            Registra tu negocio en RewardPoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-purple-100">Nombre del Negocio</Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-purple-100">Tu Nombre</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-purple-100">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-purple-100">Teléfono (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-purple-100">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                required
                minLength={6}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Crear Negocio'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-purple-200">
            <span>¿Ya tienes cuenta? </span>
            <button 
              onClick={() => navigate('login')}
              className="text-purple-400 hover:underline"
            >
              Inicia sesión
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}