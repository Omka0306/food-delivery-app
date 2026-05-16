import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, LayoutDashboard, ShoppingBag, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import CartButton from '@/components/cart/CartButton'
import { useAuthStore } from '@/store/authStore'

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-orange-50 transition-colors"
        data-testid="user-menu-btn"
      >
        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
          {initials}
        </div>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>

          {user?.role === 'customer' && (
            <Link
              to="/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600"
            >
              <ShoppingBag className="w-4 h-4" /> My Orders
            </Link>
          )}

          {user?.role === 'restaurant' && (
            <Link
              to="/restaurant/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link
              to="/admin/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          )}

          <button
            onClick={() => { setOpen(false); onLogout() }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    await logout()
    toast.success('See you soon!')
    navigate('/')
  }

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled ? 'border-b border-gray-100 shadow-sm' : ''
      } bg-white/90 backdrop-blur-md`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🍔</span>
          <span className="text-xl font-bold text-primary tracking-tight">QuickBite</span>
        </Link>

        {!isAuthenticated && (
          <p className="hidden sm:block text-sm text-gray-400 font-medium">
            🚚 Free delivery on orders above ₹499
          </p>
        )}
        {isAuthenticated && user?.role === 'restaurant' && (
          <span className="hidden sm:flex items-center bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
            🍽️ Restaurant Portal
          </span>
        )}
        {isAuthenticated && user?.role === 'admin' && (
          <span className="hidden sm:flex items-center bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
            ⚙️ Admin Panel
          </span>
        )}

        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white bg-primary hover:bg-orange-600 px-4 py-1.5 rounded-full transition-colors"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              {user?.role === 'customer' && <CartButton />}
              {user?.role === 'restaurant' && (
                <Link
                  to="/restaurant/dashboard"
                  className="text-sm font-semibold text-white bg-primary hover:bg-orange-600 px-4 py-1.5 rounded-full transition-colors"
                >
                  Go to Dashboard
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  className="text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 px-4 py-1.5 rounded-full transition-colors"
                >
                  Admin Dashboard
                </Link>
              )}
              <UserMenu user={user} onLogout={handleLogout} />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
