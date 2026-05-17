import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'
import authApi from '@/services/authApi'

const ROLE_HOME = { customer: '/', restaurant: '/restaurant/dashboard', admin: '/admin/dashboard' }

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, user } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [unverified, setUnverified] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    document.title = 'Sign In — QuickBite'
  }, [])

  useEffect(() => {
    if (isAuthenticated && user) {
      const returnUrl = location.state?.returnUrl
      navigate(returnUrl || ROLE_HOME[user.role] || '/', { replace: true })
    }
  }, [isAuthenticated, user, navigate, location.state])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setUnverified(false)
    setIsLoading(true)
    try {
      const u = await login({ email, password })
      toast.success(`Welcome back, ${u.name}! 👋`)
    } catch (err) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('not confirmed') || msg.toLowerCase().includes('unverified')) {
        setUnverified(true)
      } else if (
        msg.toLowerCase().includes('incorrect') ||
        msg.toLowerCase().includes('not authorized') ||
        msg.toLowerCase().includes('user does not exist')
      ) {
        setError('Incorrect email or password.')
      } else {
        setError(msg || 'Sign in failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await authApi.resendVerification(email)
      toast.success('Verification email resent!')
      navigate('/verify-email', { state: { email } })
    } catch (err) {
      toast.error(err.message || 'Failed to resend. Try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {/* Logo */}
          <div className="text-center">
            <span className="text-4xl">🍔</span>
            <h1 className="text-2xl font-bold text-primary mt-1">QuickBite</h1>
            <p className="text-xl font-bold text-gray-800 mt-3">Welcome back</p>
            <p className="text-sm text-gray-500">Sign in to your account</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Unverified email banner */}
          {unverified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm">
              <p className="font-semibold text-yellow-800 mb-1">Email not verified</p>
              <p className="text-yellow-700 mb-2">Please verify your email before signing in.</p>
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-orange-600 font-semibold hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend verification email'}
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-9"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <span className="text-xs text-orange-500 cursor-pointer hover:underline">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  required
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-base font-semibold bg-gradient-to-r from-primary to-orange-400 hover:from-orange-600 hover:to-orange-500"
              data-testid="submit-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
              or
            </div>
          </div>

          <div className="text-center space-y-2 text-sm">
            <p>
              New customer?{' '}
              <Link to="/register" className="text-orange-500 font-semibold hover:underline">
                Create account
              </Link>
            </p>
            <p>
              <Link
                to="/register/restaurant"
                className="text-gray-500 hover:text-orange-500 hover:underline"
              >
                Register your restaurant →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
