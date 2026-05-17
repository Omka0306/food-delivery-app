import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { aiApi } from '@/services/aiApi'

const PLACEHOLDERS = [
  "I want something spicy under ₹250…",
  "High protein vegetarian meal…",
  "Something light for this hot weather…",
  "Good for cold and cough…",
  "No onion garlic, comfort food…",
  "Quick lunch under ₹200…",
]

export default function AISearchBar({ onSearch, isLoading }) {
  const [query,           setQuery]           = useState('')
  const [placeholderIdx,  setPlaceholderIdx]  = useState(0)
  const [placeholderVis,  setPlaceholderVis]  = useState(true)
  const [isNew,           setIsNew]           = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    setIsNew(!localStorage.getItem('ai-assistant-used'))
  }, [])

  // Rotate placeholder with fade
  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderVis(false)
      setTimeout(() => {
        setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length)
        setPlaceholderVis(true)
      }, 300)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const { data: quickData } = useQuery({
    queryKey: ['ai-quick-suggestions'],
    queryFn:  () => aiApi.quickSuggestions().then((r) => r.data?.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const chips = quickData?.suggestions?.slice(0, 5).map((s) => s.name) || [
    '🌶️ Spicy food',
    '🥗 Healthy',
    '💰 Under ₹150',
    '🌿 Vegetarian',
    '🧊 Cold drinks',
  ]

  const handleSubmit = (q) => {
    const text = (q ?? query).trim()
    if (!text || isLoading) return
    setIsNew(false)
    localStorage.setItem('ai-assistant-used', '1')
    onSearch(text)
  }

  return (
    <div className="space-y-3">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-md border border-purple-100 p-4">
        {/* Label row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-700">AI Meal Assistant</span>
          {isNew && (
            <span className="ml-auto text-[10px] font-extrabold bg-amber-400 text-white px-2 py-0.5 rounded-full">
              NEW
            </span>
          )}
        </div>

        {/* Input row */}
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:opacity-60 transition-all"
              aria-label="AI meal search"
            />
            {/* Animated placeholder overlay */}
            {!query && (
              <AnimatePresence mode="wait">
                <motion.span
                  key={placeholderIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: placeholderVis ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none select-none"
                >
                  {PLACEHOLDERS[placeholderIdx]}
                </motion.span>
              </AnimatePresence>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSubmit()}
            disabled={isLoading || !query.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 hover:from-orange-600 hover:to-orange-500 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-xl text-sm transition-all shadow-sm shadow-orange-200 whitespace-nowrap"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Ask AI
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Quick suggestion chips */}
      <div className="flex flex-wrap gap-2 px-1">
        {chips.map((chip, i) => (
          <motion.button
            key={chip}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setQuery(chip); handleSubmit(chip) }}
            disabled={isLoading}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {chip}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
