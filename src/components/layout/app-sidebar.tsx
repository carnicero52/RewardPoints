'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type ViewType } from '@/store/app-store'
import { 
  LayoutDashboard, Users, ShoppingCart, Gift, Settings, 
  QrCode, Bell, ChevronLeft, ChevronRight, LogOut, Moon, Sun, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

const timezones = [
  { value: 'America/Caracas', label: 'Caracas (VEN)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (MEX)' },
  { value: 'America/Bogota', label: 'Bogotá (COL)' },
  { value: 'America/Lima', label: 'Lima (PER)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (ARG)' },
  { value: 'America/Santiago', label: 'Santiago (CHI)' },
  { value: 'America/New_York', label: 'Nueva York (USA)' },
  { value: 'Europe/Madrid', label: 'Madrid (ESP)' },
  { value: 'Europe/London', label: 'Londres (GBR)' },
]

export function AppSidebar() {
  const { currentView, navigate, user, businessName, businessLogo, logout, sidebarOpen, toggleSidebar } = useAppStore()
  const [currentTime, setCurrentTime] = useState('')
  const [timezone, setTimezone] = useState('America/Caracas')
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    // Load saved theme
    const saved = localStorage.getItem('theme')
    if (saved === 'light') {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      try {
        setCurrentTime(now.toLocaleTimeString('es', { 
          timeZone: timezone,
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        }))
      } catch {
        setCurrentTime(now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }))
      }
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [timezone])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    document.documentElement.classList.toggle('dark', newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
  }

  return (
    <div className={cn(
      "flex flex-col h-screen bg-gradient-to-b var(--sidebar-bg) transition-all duration-300",
      sidebarOpen ? "w-64" : "w-16"
    )}>
      {/* Toggle & Theme Buttons */}
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
          onClick={toggleTheme}
          className="w-full text-purple-200 hover:text-white hover:bg-white/10"
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Logo & Business Info Section */}
      {sidebarOpen && (
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          {businessLogo ? (
            <img src={businessLogo} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <Gift className="h-6 w-6 text-pink-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white truncate">{businessName}</h1>
            <p className="text-xs text-purple-300 truncate">RewardPoints</p>
          </div>
        </div>
      )}

      {/* Time & Timezone */}
      {sidebarOpen && (
        <div className="px-4 py-2 space-y-2">
          <div className="text-center text-white text-lg font-mono">
            {currentTime}
          </div>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="h-8 bg-white/10 text-purple-200 border-purple-500/30 text-xs">
              <Globe className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              {timezones.map(tz => (
                <SelectItem key={tz.value} value={tz.value} className="text-gray-200 text-xs">
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!sidebarOpen && (
        <div className="px-2 py-2 text-center text-white text-sm font-mono">
          {currentTime.split(':').slice(0,2).join(':')}
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