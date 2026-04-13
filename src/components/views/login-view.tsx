'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

export function LoginView() {
  const { login, navigate } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      localStorage.setItem('royalty_token', data.token)
      login(data.user)
      toast.success(`Welcome, ${data.user.name}!`)
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
          <CardTitle className="text-2xl text-white">FideliQR</CardTitle>
          <CardDescription className="text-purple-200">
            Ingresa a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-purple-100">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-purple-100">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-purple-200">
            <span>¿No tienes cuenta? </span>
            <button 
              onClick={() => navigate('register')}
              className="text-purple-400 hover:underline"
            >
              Regístrate
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}