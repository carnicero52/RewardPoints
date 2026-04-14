'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useAppStore, type ViewType } from '@/store/app-store'
import { 
  LayoutDashboard, Users, ShoppingCart, Gift, Settings, 
  QrCode, Bell, ChevronLeft, ChevronRight, LogOut, Moon, Sun
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems: { icon: any; label: string; view: ViewType }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
  { icon: Users, label: 'Clientes', view: 'customers' },
  { icon: ShoppingCart, label: 'Transacciones', view: 'transactions' },
  { icon: Gift, label: 'Premios', view: 'rewards' },
  { icon: QrCode, label: 'Ver código QR', view: 'settings' },
  { icon: Bell, label: 'Notificaciones', view: 'notifications' },
  { icon: Settings, label: 'Configuración', view: 'settings' },
]

export function AppSidebar() {
  const { currentView, navigate, user, businessName, logout, sidebarOpen, toggleSidebar } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const now = new Date()
    setCurrentTime(now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }))
  }, [])

  return (
    <div className={cn(
      "flex flex-col h-screen bg-gradient-to-b from-purple-900 to-indigo-900 transition-all duration-300",
      sidebarOpen ? "w-64" : "w-16"
    )}>
      {/* Toggle Button */}
      <div className="p-2 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full text-purple-200 hover:text-white hover:bg-white/10"
        >
          {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full text-purple-200 hover:text-white hover:bg-white/10"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Logo Section */}
      {sidebarOpen && (
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
            <Gift className="h-6 w-6 text-pink-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white truncate">{businessName}</h1>
            <p className="text-xs text-purple-300 truncate">RewardPoints</p>
          </div>
        </div>
      )}

      {/* Time */}
      {sidebarOpen && (
        <div className="px-4 py-2 text-center text-purple-300 text-sm">
          {currentTime}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2">
        {navItems.map((item) => (
          <Button
            key={item.view}
            variant="ghost"
            className={cn(
              "w-full justify-start text-purple-200 hover:text-white hover:bg-white/10",
              currentView === item.view && "bg-white/10 text-white",
              !sidebarOpen && "justify-center px-0"
            )}
            onClick={() => navigate(item.view)}
          >
            <item.icon className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">{item.label}</span>}
          </Button>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-white/10 p-4">
        {sidebarOpen && user && (
          <div className="mb-3">
            <p className="text-white text-sm font-medium">{user.name}</p>
            <p className="text-purple-300 text-xs">{user.role}</p>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className={cn(
            "border-purple-500 text-purple-200 hover:bg-purple-800",
            !sidebarOpen && "w-full px-0"
          )}
        >
          <LogOut className="h-4 w-4" />
          {sidebarOpen && <span className="ml-2">Cerrar sesión</span>}
        </Button>
      </div>
    </div>
  )
}
