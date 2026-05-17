import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ThumbsUp, ThumbsDown, Clock, MapPin, CloudSun, AlertCircle, RefreshCw } from 'lucide-react'
import { aiApi } from '@/services/aiApi'
import RecommendationCard from './RecommendationCard'
import toast from 'react-hot-toast'

// ── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3.5 flex gap-3 animate-pulse">
      <div className="w-20 h-20 rounded-xl bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="flex gap-1 mt-1">
          <div className="h-4 w-10 bg-gray-100 rounded-full" />
          <div className="h-4 w-14 bg-gray-100 rounded-full" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-gray-200" />
        <div className="w-12 h-5 bg-gray-200 rounded" />
        <div className="w-14 h-6 bg-gray-200 rounded-full" />
      </div>
    </div>
  )
}

// ── Typewriter greeting ──────────────────────────────────────────────────────
function TypewriterText({ text, speed = 28 }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    if (!text) return
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return <span>{displayed}</span>
}

// ── Rate-limit countdown ─────────────────────────────────────────────────────
function RateLimitCountdown({ resetMs }) {
  const [remaining, setRemaining] = useState(Math.max(0, resetMs || 60000))
  useEffect(() => {
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1000)), 1000)
    return () => clearInterval(id)
  }, [])
  const mins = String(Math.floor(remaining / 60000)).padStart(2, '0')
  const secs = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')
  return <span className="font-mono font-bold">{mins}:{secs}</span>
}

// ── Context pills ────────────────────────────────────────────────────────────
function ContextPills({ context }) {
  if (!context) return null
  const pills = []
  if (context.time?.meal)          pills.push({ icon: <Clock className="w-3 h-3" />,   label: context.time.meal,             color: 'amber' })
  if (context.weather?.condition && context.weather.condition !== 'unknown')
    pills.push({ icon: <CloudSun className="w-3 h-3" />, label: `${context.weather.condition} ${context.weather.temp ?? ''}°C`, color: 'blue' })
  if (context.weather?.city)       pills.push({ icon: <MapPin className="w-3 h-3" />,  label: context.weather.city,           color: 'gray' })

  if (!pills.length) return null

  const colorMap = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue:  'bg-blue-50 text-blue-700 border-blue-200',
    gray:  'bg-gray-50 text-gray-600 border-gray-200',
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {pills.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + i * 0.1 }}
          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorMap[p.color]}`}
        >
          {p.icon}
          {p.label}
        </motion.span>
      ))}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AIRecommendationResults({
  recommendations = [],
  greeting        = '',
  tip             = null,
  context         = null,
  isLoading       = false,
  error           = null,
  onRetry,
}) {
  const [feedbackSent, setFeedbackSent] = useState(false)

  const handleFeedback = async (action) => {
    setFeedbackSent(true)
    try {
      await aiApi.sendFeedback(null, null, action)
    } catch { /* non-critical */ }
    toast.success('Thanks for the feedback! 🙏')
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-purple-600 font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 animate-pulse" />
          Finding the perfect meal for you… 🔍
        </p>
        {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  // ── Rate limit error ─────────────────────────────────────────────────────
  if (error?.type === 'rate_limit') {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
        <span className="text-3xl">🚦</span>
        <div>
          <p className="font-bold text-gray-800">You've reached your recommendation limit</p>
          <p className="text-sm text-gray-500 mt-1">
            Available again in{' '}
            <RateLimitCountdown resetMs={error.resetMs || 3600000} />
          </p>
        </div>
        {error.message && (
          <p className="text-xs text-purple-600 bg-purple-100 px-3 py-1 rounded-full">{error.message}</p>
        )}
      </div>
    )
  }

  // ── General error ────────────────────────────────────────────────────────
  if (error?.type === 'general') {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-orange-500" />
        <div>
          <p className="font-bold text-gray-800">Something went wrong</p>
          <p className="text-sm text-gray-500 mt-1">{error.message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </button>
        )}
      </div>
    )
  }

  // ── Empty / no results ───────────────────────────────────────────────────
  if (!recommendations?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <span className="text-5xl">👨‍🍳</span>
        <p className="font-bold text-gray-700">Hmm, nothing matched exactly</p>
        <p className="text-sm text-gray-400">Try something like "spicy pizza" or "healthy under ₹200"</p>
      </div>
    )
  }

  // ── Results ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Greeting + context pills */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl px-4 py-3 border border-purple-100">
        <p className="text-base font-semibold text-gray-800 italic leading-snug">
          <TypewriterText text={greeting} />
        </p>
        <ContextPills context={context} />
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {recommendations.map((item, i) => (
          <RecommendationCard key={item.menuItemId || i} item={item} index={i} />
        ))}
      </div>

      {/* AI tip */}
      <AnimatePresence>
        {tip && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3"
          >
            <span className="text-base mt-0.5 flex-shrink-0">💡</span>
            <p className="text-sm italic text-purple-800 leading-relaxed">{tip}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback row */}
      <div className="flex items-center justify-end gap-3 pt-1">
        {feedbackSent ? (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-400"
          >
            Thanks for the feedback! 🙏
          </motion.span>
        ) : (
          <>
            <span className="text-xs text-gray-400">Were these helpful?</span>
            <button
              onClick={() => handleFeedback('up')}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition-colors px-2 py-1 rounded-lg hover:bg-green-50"
            >
              <ThumbsUp className="w-3.5 h-3.5" /> Yes
            </button>
            <button
              onClick={() => handleFeedback('down')}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
            >
              <ThumbsDown className="w-3.5 h-3.5" /> No
            </button>
          </>
        )}
      </div>
    </div>
  )
}
