'use client'

import { useAppStore } from '@/store/app-store'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { LandingView } from '@/components/views/landing-view'
import { LoginView } from '@/components/views/login-view'
import { RegisterView } from '@/components/views/register-view'
import { DashboardView } from '@/components/views/dashboard-view'
import { CustomersView } from '@/components/views/customers-view'
import { TransactionsView } from '@/components/views/transactions-view'
import { RewardsView } from '@/components/views/rewards-view'
import { SettingsView } from '@/components/views/settings-view'
import { PublicCheckInView } from '@/components/views/public-checkin-view'
import { NotificationsView } from '@/components/views/notifications-view'

const views: Record<string, React.ComponentType<any>> = {
  landing: LandingView,
  login: LoginView,
  register: RegisterView,
  dashboard: DashboardView,
  customers: CustomersView,
  transactions: TransactionsView,
  rewards: RewardsView,
  settings: SettingsView,
  'public-checkin': PublicCheckInView,
  notifications: NotificationsView,
}

export function MainLayout() {
  const { currentView, isAuthenticated } = useAppStore()

  // Public check-in always accessible
  if (currentView === 'public-checkin') {
    const ViewComponent = views['public-checkin']
    return (
      <div className="min-h-screen">
        <ViewComponent />
      </div>
    )
  }

  // Auth required for everything else
  if (!isAuthenticated) {
    const publicViews = ['landing', 'login', 'register']
    if (publicViews.includes(currentView)) {
      const ViewComponent = views[currentView]
      return ViewComponent ? <ViewComponent /> : <LandingView />
    }
    return <LandingView />
  }

  // Authenticated layout with sidebar
  const ViewComponent = views[currentView]
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6 bg-gray-50 overflow-auto">
        {ViewComponent ? <ViewComponent /> : <DashboardView />}
      </main>
    </div>
  )
}