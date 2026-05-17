import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import authApi from '@/services/authApi'

function passwordStrength(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  return score
}

const STRENGTH_LABELS = ['', 'Weak', 'Medium', 'Strong']
const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-yellow-400', 'bg-green-500']
const STRENGTH_TEXT = ['', 'text-red-600', 'text-yellow-600', 'text-green-600']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Create Account — QuickBite'
  }, [])

  const strength = passwordStrength(form.password)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (!agreed) return setError('Please accept the Terms & Privacy Policy.')
    setIsLoading(true)
    try {
      await authApi.register({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone,
      })
      toast.success('Account created! Check your email.')
      navigate('/verify-email', { state: { email: form.email, password: form.password } })
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left illustration */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-primary to-orange-600 flex-col justify-center px-12 text-white">
        <h2 className="text-3xl font-bold mb-8">Join QuickBite</h2>
        <ul className="space-y-4">
          {[
            'Order from top restaurants',
            'Real-time delivery tracking',
            'Exclusive deals and offers',
          ].map((b) => (
            <li key={b} className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-orange-200 flex-shrink-0" />
              <span className="text-orange-50">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Create account</h1>
            <p className="text-sm text-gray-500 mt-1">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-500 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={form.name} onChange={set('name')} placeholder="John Doe" className="pl-9" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className="pl-9" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Phone (10 digits)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input type="tel" value={form.phone} onChange={set('phone')} placeholder="9876543210" className="pl-9" pattern="[0-9]{10}" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min 8 chars, uppercase, number"
                  className="pl-9 pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="space-y-1">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${STRENGTH_COLORS[strength]}`}
                      style={{ width: `${(strength / 3) * 100}%` }}
                    />
                  </div>
                  <p className={`text-xs font-medium ${STRENGTH_TEXT[strength]}`}>
                    {STRENGTH_LABELS[strength]}
                  </p>
                  <ul className="text-xs text-gray-400 space-y-0.5">
                    <li className={form.password.length >= 8 ? 'text-green-600' : ''}>
                      {form.password.length >= 8 ? '✓' : '○'} 8+ characters
                    </li>
                    <li className={/[A-Z]/.test(form.password) ? 'text-green-600' : ''}>
                      {/[A-Z]/.test(form.password) ? '✓' : '○'} Uppercase letter
                    </li>
                    <li className={/[0-9]/.test(form.password) ? 'text-green-600' : ''}>
                      {/[0-9]/.test(form.password) ? '✓' : '○'} Number
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={form.confirm}
                onChange={set('confirm')}
                placeholder="Re-enter password"
                required
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-orange-500"
              />
              <span className="text-xs text-gray-500">
                I agree to the{' '}
                <span className="text-orange-500 hover:underline cursor-pointer">Terms</span> &{' '}
                <span className="text-orange-500 hover:underline cursor-pointer">Privacy Policy</span>
              </span>
            </label>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-base font-semibold bg-gradient-to-r from-primary to-orange-400 hover:from-orange-600 hover:to-orange-500"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account…</>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
