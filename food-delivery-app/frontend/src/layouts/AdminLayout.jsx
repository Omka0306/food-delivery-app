import { useState } from 'react'
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Store, Users, ClipboardList, BarChart3, Menu, X, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminRestaurantsPage from '@/pages/admin/AdminRestaurantsPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage'
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage'

const NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/restaurants', icon: Store, label: 'Restaurants' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
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
    <aside className="flex flex-col h-full w-64 bg-gray-950 text-white">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🍔</span>
              <span className="font-bold text-white">QuickBite</span>
            </div>
            <span className="inline-flex items-center mt-1 text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-medium">
              Admin Panel
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
                  ? 'bg-purple-600 text-white'
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
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
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

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex">
            <Sidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 bg-gray-950 text-white flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold">⚙️ Admin Panel</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="restaurants" element={<AdminRestaurantsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route index element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
