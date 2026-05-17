import { useState } from 'react'
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, UtensilsCrossed, Settings, Menu, X, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import RestaurantDashboard from '@/pages/restaurant/RestaurantDashboard'
import RestaurantOrdersPage from '@/pages/restaurant/RestaurantOrdersPage'
import RestaurantMenuPage from '@/pages/restaurant/RestaurantMenuPage'
import RestaurantSettingsPage from '@/pages/restaurant/RestaurantSettingsPage'

const NAV = [
  { to: '/restaurant/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/restaurant/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/restaurant/menu', icon: UtensilsCrossed, label: 'Menu Management' },
  { to: '/restaurant/settings', icon: Settings, label: 'Settings' },
]

function Sidebar({ mobile, onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('See you soon!')
    navigate('/')
  }

  return (
    <aside className="flex flex-col h-full w-64 bg-gray-900 text-white">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-white truncate">{user?.name || 'Restaurant'}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Active
            </span>
          </div>
          {mobile && (
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  )
}

export default function RestaurantLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex">
            <Sidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 bg-gray-900 text-white flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold">🍔 QuickBite Partner</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="dashboard" element={<RestaurantDashboard />} />
            <Route path="orders" element={<RestaurantOrdersPage />} />
            <Route path="menu" element={<RestaurantMenuPage />} />
            <Route path="settings" element={<RestaurantSettingsPage />} />
            <Route index element={<RestaurantDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
