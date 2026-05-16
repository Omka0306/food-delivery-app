import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ChevronRight, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import authApi from '@/services/authApi'

const CUISINES = ['American', 'Italian', 'Indian', 'Chinese', 'Mexican', 'Other']
const STEPS = ['Account Details', 'Restaurant Info', 'Review & Submit']

export default function RestaurantRegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '', name: '', phone: '',
    restaurantName: '', cuisine: 'American', description: '', address: '',
  })

  useEffect(() => { document.title = 'Register Restaurant — QuickBite' }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validateStep = () => {
    if (step === 0) {
      if (!form.email || !form.password || !form.name || !form.phone)
        return 'Please fill all required fields.'
      if (form.password !== form.confirmPassword) return 'Passwords do not match.'
      if (form.password.length < 8) return 'Password must be at least 8 characters.'
    }
    if (step === 1) {
      if (!form.restaurantName || !form.address) return 'Please fill restaurant name and address.'
    }
    return ''
  }

  const handleNext = () => {
    const err = validateStep()
    if (err) return setError(err)
    setError('')
    setStep((s) => s + 1)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')
    try {
      await authApi.registerRestaurant({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone,
        restaurantName: form.restaurantName,
        cuisine: form.cuisine,
        description: form.description,
        address: form.address,
      })
      setSubmitted(true)
    } catch (err) {
      if (err.details?.length) {
        err.details.forEach((d) => {
          const msg = d.message.replace(/^"([^"]+)"\s*/i, (_, field) =>
            field.charAt(0).toUpperCase() + field.slice(1) + ' '
          )
          toast.error(msg, { duration: 4000 })
        })
        setError('Please fix the highlighted fields and try again.')
      } else {
        const msg = err.message || 'Registration failed. Please try again.'
        toast.error(msg)
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Application Submitted!</h2>
          <p className="text-gray-500">
            A verification code has been sent to <strong>{form.email}</strong>.
            Verify your email to activate your account.
          </p>
          <Button asChild className="w-full bg-gradient-to-r from-primary to-orange-400">
            <Link to="/verify-email" state={{ email: form.email }}>
              Verify Email →
            </Link>
          </Button>
          <Link to="/" className="block text-sm text-gray-400 hover:text-gray-600">
            I'll verify later
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 space-y-6">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>
                  {s}
                </span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-green-400' : 'bg-gray-100'}`} />}
              </div>
            ))}
          </div>
          <h1 className="text-xl font-bold text-gray-800">{STEPS[step]}</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Step 0: Account */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Business Email *</Label>
              <Input type="email" value={form.email} onChange={set('email')} placeholder="restaurant@example.com" required />
            </div>
            <div className="space-y-1.5">
              <Label>Owner Full Name *</Label>
              <Input value={form.name} onChange={set('name')} placeholder="Your full name" required />
            </div>
            <div className="space-y-1.5">
              <Label>Phone (10 digits) *</Label>
              <Input type="tel" value={form.phone} onChange={set('phone')} placeholder="9876543210" pattern="[0-9]{10}" required />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min 8 chars, uppercase, number"
                  className="pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password *</Label>
              <Input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password" required />
            </div>
          </div>
        )}

        {/* Step 1: Restaurant */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Restaurant Name *</Label>
              <Input value={form.restaurantName} onChange={set('restaurantName')} placeholder="The Burger Lab" required />
            </div>
            <div className="space-y-1.5">
              <Label>Cuisine Type</Label>
              <select
                value={form.cuisine}
                onChange={set('cuisine')}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                {CUISINES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea
                value={form.description}
                onChange={set('description')}
                placeholder="Describe your restaurant…"
                rows={3}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Full Address *</Label>
              <textarea
                value={form.address}
                onChange={set('address')}
                placeholder="123 Main St, City, State 400001"
                rows={2}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 resize-none"
                required
              />
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div className="space-y-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-gray-700">Account</h3>
              <p><span className="text-gray-400">Name:</span> {form.name}</p>
              <p><span className="text-gray-400">Email:</span> {form.email}</p>
              <p><span className="text-gray-400">Phone:</span> {form.phone}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-gray-700">Restaurant</h3>
              <p><span className="text-gray-400">Name:</span> {form.restaurantName}</p>
              <p><span className="text-gray-400">Cuisine:</span> {form.cuisine}</p>
              <p><span className="text-gray-400">Address:</span> {form.address}</p>
              {form.description && <p><span className="text-gray-400">Description:</span> {form.description}</p>}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button type="button" onClick={handleNext} className="flex-1 bg-gradient-to-r from-primary to-orange-400">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-gradient-to-r from-primary to-orange-400">
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : 'Submit Application'}
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-gray-400">
          <Link to="/login" className="hover:text-gray-600">Already have an account? Sign in</Link>
        </p>
      </div>
    </div>
  )
}
