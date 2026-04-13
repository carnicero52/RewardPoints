'use client'

import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'

export function LandingView() {
  const { navigate } = useAppStore()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-violet-800">
      <div className="text-center space-y-8 p-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            Royalty <span className="text-purple-400">QR</span>
          </h1>
          <p className="text-xl text-purple-200 max-w-md mx-auto">
            Plataforma de fidelización con códigos QR
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-purple-600 hover:bg-purple-700 text-lg px-8"
            onClick={() => navigate('register')}
          >
            Comenzar ahora
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-purple-400 text-purple-100 hover:bg-purple-800 text-lg px-8"
            onClick={() => navigate('login')}
          >
            Iniciar sesión
          </Button>
        </div>

        <div className="pt-8 text-purple-300 text-sm">
          <p>🏆 Programa de puntos</p>
          <p>📱 Mobile First</p>
          <p>🔐 Multi-negocio</p>
        </div>
      </div>
    </div>
  )
}