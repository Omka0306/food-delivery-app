import { useRef } from 'react'
import { motion } from 'framer-motion'
import { getCategoryEmoji, getCategoryBg } from '@/config/categories'

// `categories` prop: array of category label strings present in the current menu.
// Always prepends an "All" option automatically.
export default function CategoryFilter({ active, onChange, categories = [] }) {
  const scrollRef = useRef(null)

  const tabs = [
    { label: 'All', emoji: '🍽️', bg: 'bg-gray-100' },
    ...categories
      .filter((c) => c && c !== 'All')
      .map((c) => ({ label: c, emoji: getCategoryEmoji(c), bg: getCategoryBg(c) })),
  ]

  return (
    <div
      ref={scrollRef}
      className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide px-1"
    >
      {tabs.map((cat) => {
        const isActive = active === cat.label
        return (
          <motion.button
            key={cat.label}
            whileTap={{ scale: 0.92 }}
            onClick={() => onChange(cat.label)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary shadow-lg shadow-orange-200 ring-2 ring-primary ring-offset-2 scale-110'
                  : `${cat.bg} ring-1 ring-gray-200 hover:scale-105`
              }`}
            >
              {cat.emoji}
            </div>
            <span
              className={`text-xs font-semibold transition-colors duration-200 max-w-[4rem] text-center leading-tight ${
                isActive ? 'text-primary' : 'text-gray-500'
              }`}
            >
              {cat.label.toUpperCase()}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
