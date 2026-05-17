import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Mail, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import authApi from '@/services/authApi'

const RESEND_COOLDOWN = 60

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [error, setError] = useState('')
  const inputRefs = useRef([])

  useEffect(() => {
    document.title = 'Verify Email — QuickBite'
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleDigit = (i, val) => {
    const clean = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = clean
    setDigits(next)
    if (clean && i < 5) inputRefs.current[i + 1]?.focus()
    if (next.every((d) => d)) handleVerify(next.join(''))
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setDigits(text.split(''))
      handleVerify(text)
    }
  }

  const handleVerify = async (code) => {
    if (!email) return setError('Email not found. Please register again.')
    setIsVerifying(true)
    setError('')
    try {
      await authApi.verify(email, code)
      toast.success('Email verified! You can now sign in.')
      navigate('/login', { state: { email } })
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.')
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      await authApi.resendVerification(email)
      toast.success('Verification code resent!')
      setCountdown(RESEND_COOLDOWN)
      setDigits(['', '', '', '', '', ''])
    } catch (err) {
      toast.error(err.message || 'Failed to resend.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
            <Mail className="w-10 h-10 text-orange-500" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-800">Check your email</h1>
          <p className="text-gray-500 text-sm mt-2">
            We sent a 6-digit verification code to
          </p>
          <p className="font-semibold text-gray-700 mt-1">{email || 'your email address'}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* OTP boxes */}
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-colors focus:border-orange-400 border-gray-200"
              data-testid={`otp-${i}`}
            />
          ))}
        </div>

        {isVerifying && (
          <div className="flex items-center justify-center gap-2 text-orange-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Verifying…</span>
          </div>
        )}

        <div className="text-sm text-gray-500">
          {countdown > 0 ? (
            <p>
              Resend code in{' '}
              <span className="font-mono font-semibold text-gray-700">
                00:{String(countdown).padStart(2, '0')}
              </span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-orange-500 font-semibold hover:underline disabled:opacity-50"
            >
              {isResending ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </div>

        <Button
          onClick={() => handleVerify(digits.join(''))}
          disabled={digits.some((d) => !d) || isVerifying}
          className="w-full bg-gradient-to-r from-primary to-orange-400"
        >
          Verify Email
        </Button>

        <Link to="/login" className="block text-sm text-gray-400 hover:text-gray-600">
          ← Back to sign in
        </Link>
      </div>
    </div>
  )
}
