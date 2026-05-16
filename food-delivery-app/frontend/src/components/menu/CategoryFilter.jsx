import { motion } from 'framer-motion'

const CATEGORIES = [
  { label: 'All', emoji: '🍽️' },
  { label: 'Pizza', emoji: '🍕' },
  { label: 'Burgers', emoji: '🍔' },
  { label: 'Sides', emoji: '🍟' },
  { label: 'Drinks', emoji: '🥤' },
]

export default function CategoryFilter({ active, onChange }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" id="menu">
      {CATEGORIES.map((cat) => {
        const isActive = active === cat.label
        return (
          <motion.button
            key={cat.label}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(cat.label)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap border transition-all duration-200 ${
              isActive
                ? 'bg-primary text-white border-primary shadow-md shadow-orange-200'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
