import { create } from 'zustand'
import { persist } from 'zustand/middleware/persist'

export type ViewType = 
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'customers'
  | 'transactions'
  | 'rewards'
  | 'settings'
  | 'public-checkin'
  | 'notifications'

interface User {
  id: string
  businessId: string
  name: string
  email: string
  role: string
}

interface AppState {
  user: User | null
  isAuthenticated: boolean
  businessName: string
  businessLogo: string
  currentView: ViewType
  viewParams: Record<string, string>

  login: (user: User) => void
  logout: () => void
  setBusiness: (name: string, logo?: string) => void
  navigate: (view: ViewType, params?: Record<string, string>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      businessName: 'RewardPoints',
      businessLogo: '',
      currentView: 'landing',
      viewParams: {},

      login: (user) => set({ 
        user, 
        isAuthenticated: true, 
        currentView: 'dashboard' 
      }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('royalty_token')
        }
        set({ 
          user: null, 
          isAuthenticated: false, 
          currentView: 'landing',
          businessName: 'RewardPoints',
          businessLogo: ''
        })
      },

      setBusiness: (name, logo = '') => set({ 
        businessName: name, 
        businessLogo: logo 
      }),

      navigate: (view, params = {}) => set({ 
        currentView: view, 
        viewParams: params 
      }),
    }),
    {
      name: 'royalty-qr-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        businessName: state.businessName,
        businessLogo: state.businessLogo,
        currentView: state.currentView,
      }),
    }
  )
)