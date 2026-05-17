import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, X, ChevronDown, ThumbsUp, ThumbsDown, ShoppingCart, Loader2 } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { aiApi } from '@/services/api'
import useCart from '@/hooks/useCart'

function RecommendationCard({ item, onAddToCart }) {
  const [feedback, setFeedback] = useState(null)

  const handleFeedback = (rating) => {
    setFeedback(rating)
    toast.success(rating === 'up' ? 'Thanks for the feedback!' : 'Got it, we\'ll improve!')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-orange-100 p-3.5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm truncate">{item.name}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.reason}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-sm font-bold text-primary">₹{item.price}</span>
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(item)}
              className="flex items-center gap-1 bg-primary text-white text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-orange-600 transition-colors"
            >
              <ShoppingCart className="w-3 h-3" /> Add
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-gray-50">
        <span className="text-[10px] text-gray-400">Helpful?</span>
        <button
          onClick={() => handleFeedback('up')}
          className={`p-1 rounded-full transition-colors ${feedback === 'up' ? 'text-green-500 bg-green-50' : 'text-gray-300 hover:text-green-500'}`}
        >
          <ThumbsUp className="w-3 h-3" />
        </button>
        <button
          onClick={() => handleFeedback('down')}
          className={`p-1 rounded-full transition-colors ${feedback === 'down' ? 'text-red-400 bg-red-50' : 'text-gray-300 hover:text-red-400'}`}
        >
          <ThumbsDown className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  )
}

function QuickChips({ onSelect }) {
  const chips = [
    '🍕 Something cheesy',
    '🥗 Healthy option',
    '🌶️ Spicy craving',
    '💧 Refreshing drink',
    '⚡ Quick under ₹150',
  ]
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          className="text-xs bg-orange-50 text-primary font-medium px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors border border-orange-100"
        >
          {chip}
        </button>
      ))}
    </div>
  )
}

export default function MealAssistant() {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [result, setResult]   = useState(null)
  const [history, setHistory] = useState([])
  const inputRef = useRef(null)
  const { addItem } = useCart()

  const { data: quickData } = useQuery({
    queryKey: ['ai-quick-suggestions'],
    queryFn:  () => aiApi.quickSuggestions().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (q) => aiApi.recommend(q).then((r) => r.data.data),
    onSuccess: (data) => {
      setResult(data)
      setHistory((prev) => [{ query, result: data, at: new Date() }, ...prev.slice(0, 4)])
      setQuery('')
    },
    onError: () => toast.error('AI assistant is busy. Try again shortly.'),
  })

  const handleSubmit = (q) => {
    const text = (q || query).trim()
    if (!text) return
    mutate(text)
  }

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 text-white font-bold px-4 py-3 rounded-full shadow-lg shadow-orange-300/50 hover:shadow-orange-400/60 transition-shadow"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm">AI Meal Pick</span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-gray-50 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-orange-400 px-5 pt-safe-top pt-5 pb-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-white text-base leading-tight">AI Meal Assistant</h2>
                  <p className="text-white/75 text-xs">Tell me what you're craving</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Quick chips (no result yet) */}
                {!result && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Try asking…</p>
                    <QuickChips onSelect={(chip) => handleSubmit(chip)} />
                  </div>
                )}

                {/* Quick suggestions from API */}
                {!result && quickData?.suggestions?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">
                      {quickData.context?.meal
                        ? `Suggested for ${quickData.context.meal}`
                        : 'Popular right now'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickData.suggestions.slice(0, 4).map((item) => (
                        <button
                          key={item.menuItemId}
                          onClick={() => handleSubmit(`tell me about ${item.name}`)}
                          className="text-left bg-white rounded-xl p-3 border border-gray-100 hover:border-orange-200 transition-colors shadow-sm"
                        >
                          <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                          <p className="text-xs text-primary font-semibold mt-0.5">₹{item.price}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading */}
                {isPending && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                    <p className="text-sm text-gray-500">Finding the perfect meal…</p>
                  </div>
                )}

                {/* Result */}
                {result && !isPending && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    {/* Greeting */}
                    <div className="bg-orange-50 rounded-2xl px-4 py-3 border border-orange-100">
                      <p className="text-sm text-gray-700">{result.greeting}</p>
                    </div>

                    {/* Recommendations */}
                    {result.recommendations?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500">Recommended for you</p>
                        {result.recommendations.map((item) => (
                          <RecommendationCard
                            key={item.menuItemId}
                            item={item}
                            onAddToCart={(i) => {
                              addItem({
                                id:    i.menuItemId,
                                name:  i.name,
                                price: i.price,
                              })
                              toast.success(`${i.name} added to cart!`)
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Tip */}
                    {result.tip && (
                      <div className="bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
                        <p className="text-xs text-blue-700">💡 {result.tip}</p>
                      </div>
                    )}

                    {/* Ask again */}
                    <button
                      onClick={() => setResult(null)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary font-medium transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5 rotate-90" /> Ask something else
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="I'm craving something…"
                    disabled={isPending}
                    className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent disabled:opacity-50 bg-gray-50"
                  />
                  <button
                    onClick={() => handleSubmit()}
                    disabled={isPending || !query.trim()}
                    className="w-10 h-10 rounded-xl bg-primary hover:bg-orange-600 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    {isPending
                      ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                      : <Send className="w-4 h-4 text-white" />
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
