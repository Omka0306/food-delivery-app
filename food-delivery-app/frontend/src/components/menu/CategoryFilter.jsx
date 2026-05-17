import { useRef } from 'react'
import { motion } from 'framer-motion'

const CATEGORIES = [
  { label: 'All',     emoji: '🍽️', bg: 'bg-orange-100' },
  { label: 'Pizza',   emoji: '🍕', bg: 'bg-red-100'    },
  { label: 'Burgers', emoji: '🍔', bg: 'bg-yellow-100' },
  { label: 'Sides',   emoji: '🍟', bg: 'bg-green-100'  },
  { label: 'Drinks',  emoji: '🥤', bg: 'bg-blue-100'   },
]

export default function CategoryFilter({ active, onChange }) {
  const scrollRef = useRef(null)

  return (
    <div
      ref={scrollRef}
      className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide px-1"
    >
      {CATEGORIES.map((cat) => {
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
                  : `${cat.bg} hover:scale-105`
              }`}
            >
              {cat.emoji}
            </div>
            <span
              className={`text-xs font-semibold transition-colors duration-200 ${
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
