'use client'

import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, QrCode, Gift, Users, Bell, BarChart3, Shield } from 'lucide-react'

export function LandingView() {
  const { navigate } = useAppStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
            <QrCode className="h-5 w-5 text-pink-400" />
            <span className="text-white font-medium">FideliQR</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
            Fideliza a tus clientes con
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              códigos QR
            </span>
          </h1>
          
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Programa de puntos y recompensas multi-negocio. 
            Tus clientes escanean, ganan puntos y canjean premios.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="bg-pink-600 hover:bg-pink-700 text-lg px-8"
              onClick={() => navigate('register')}
            >
              Crear mi negocio
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10 text-lg px-8"
              onClick={() => navigate('login')}
            >
              Iniciar sesión
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20">
          <FeatureCard 
            icon={QrCode}
            title="Códigos QR"
            description="Cada negocio tiene su propio código QR para que clientes escaneen y registran sus visitas."
          />
          <FeatureCard 
            icon={Gift}
            title="Programa de Puntos"
            description="Configura cuántos puntos da cada compra y cuántos necesita el cliente para un premio."
          />
          <FeatureCard 
            icon={Users}
            title="Gestión de Clientes"
            description="Registra clientes, historial de compras, puntos acumulados y estado de recompensas."
          />
          <FeatureCard 
            icon={Bell}
            title="Notificaciones"
            description="Envía notificaciones por email o Telegram a tus clientes."
          />
          <FeatureCard 
            icon={BarChart3}
            title="Estadísticas"
            description="Visualiza el rendimiento de tu programa de fidelización con métricas clave."
          />
          <FeatureCard 
            icon={Shield}
            title="Multi-Negocio"
            description="Un solo panel admin para gestionar múltiples negocios independientes."
          />
        </div>

        {/* CTA */}
        <div className="text-center mt-20">
          <p className="text-purple-200 text-lg">
            ¿Tienes múltiples negocios? 
            <Button variant="link" className="text-pink-400" onClick={() => navigate('superadmin')}>
              Panel Super Admin
            </Button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-purple-300">
          <p>© 2026 FideliQR. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <Card className="bg-white/5 backdrop-blur border-white/10">
      <CardContent className="p-6">
        <div className="h-12 w-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-pink-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-purple-200 text-sm">{description}</p>
      </CardContent>
    </Card>
  )
}