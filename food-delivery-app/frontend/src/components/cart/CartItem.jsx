import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Plus, Minus } from 'lucide-react'
import toast from 'react-hot-toast'
import useCart from '@/hooks/useCart'

export default function CartItem({ item }) {
  const { incrementQuantity, decrementQuantity, removeItem } = useCart()
  const [hovered, setHovered] = useState(false)

  const handleRemove = () => {
    removeItem(item.id)
    toast(`Removed ${item.name}`, { icon: '🗑️', duration: 2000 })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid="cart-item"
    >
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-orange-50 flex-shrink-0">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
        <p className="text-primary font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
        <p className="text-xs text-gray-400">${item.price.toFixed(2)} each</p>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => decrementQuantity(item.id)}
          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
          data-testid="cart-decrement"
        >
          <Minus className="w-3 h-3" />
        </motion.button>
        <span className="w-5 text-center font-bold text-sm" data-testid="cart-qty">{item.quantity}</span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => incrementQuantity(item.id)}
          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
          data-testid="cart-increment"
        >
          <Plus className="w-3 h-3" />
        </motion.button>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0 }}
        onClick={handleRemove}
        className="ml-1 text-red-400 hover:text-red-600 transition-colors"
        data-testid="cart-remove"
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </motion.div>
  )
}
