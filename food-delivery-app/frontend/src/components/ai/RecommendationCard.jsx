import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Check, Flame, Leaf, Heart } from 'lucide-react'
import useCart from '@/hooks/useCart'
import toast from 'react-hot-toast'

// Circular match-score SVG
function MatchRing({ score = 0 }) {
  const r   = 14
  const c   = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, Math.round(score)))
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative w-9 h-9">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r={r} fill="none" stroke="#f3f4f6" strokeWidth="3" />
          <motion.circle
            cx="18" cy="18" r={r}
            fill="none"
            stroke="url(#aiGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c - (pct / 100) * c }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-extrabold text-purple-700">
          {pct}%
        </span>
      </div>
      <span className="text-[9px] text-gray-400 font-medium">match</span>
    </div>
  )
}

export default function RecommendationCard({ item, index = 0 }) {
  const [added, setAdded] = useState(false)
  const { addItem }       = useCart()

  const handleAdd = () => {
    addItem({
      id:           item.menuItemId,
      name:         item.name,
      price:        item.price,
      restaurantId: item.restaurantId,
      imageUrl:     item.imageUrl,
    })
    setAdded(true)
    toast.success(`${item.name} added to cart! 🛒`)
    setTimeout(() => setAdded(false), 1800)
  }

  // Derive match score from _score (OpenSearch relevance) or default 90+
  const score = item._score
    ? Math.min(99, Math.round(60 + (item._score / 120) * 39))
    : 92 - index * 3

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex gap-3 hover:shadow-md hover:border-purple-100 transition-all"
    >
      {/* Image */}
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-orange-50 flex-shrink-0">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm truncate">{item.name}</p>

        {/* AI reason — italic purple */}
        {item.reason && (
          <p className="text-xs italic text-purple-700 mt-0.5 line-clamp-2 leading-relaxed">
            "{item.reason}"
          </p>
        )}

        {/* Highlight tags */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {item.isVeg !== undefined && (
            <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              item.isVeg
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              <Leaf className="w-2.5 h-2.5" />
              {item.isVeg ? 'Veg' : 'Non-Veg'}
            </span>
          )}
          {item.spiceLevel > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
              <Flame className="w-2.5 h-2.5" />
              {'🌶'.repeat(Math.min(item.spiceLevel, 3))}
            </span>
          )}
          {item.healthScore >= 7 && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              <Heart className="w-2.5 h-2.5" />
              Healthy
            </span>
          )}
          {item.calories > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
              {item.calories} cal
            </span>
          )}
        </div>
      </div>

      {/* Price + add + score */}
      <div className="flex flex-col items-end justify-between flex-shrink-0 gap-1">
        <MatchRing score={score} />
        <span className="text-base font-extrabold text-primary">₹{item.price}</span>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleAdd}
          className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
            added
              ? 'bg-green-500 text-white'
              : 'bg-primary text-white hover:bg-orange-600'
          }`}
        >
          {added ? <Check className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
          {added ? 'Added!' : 'Add'}
        </motion.button>
      </div>
    </motion.div>
  )
}
