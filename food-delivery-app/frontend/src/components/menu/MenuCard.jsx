import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Star, Plus, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import useCart from '@/hooks/useCart'

const fallbackColors = {
  Pizza: 'from-orange-400 to-red-400',
  Burgers: 'from-yellow-400 to-orange-400',
  Sides: 'from-green-400 to-teal-400',
  Drinks: 'from-blue-400 to-cyan-400',
}

const fallbackEmojis = {
  Pizza: '🍕',
  Burgers: '🍔',
  Sides: '🍟',
  Drinks: '🥤',
}

export default function MenuCard({ item, index }) {
  const { addItem, incrementQuantity, decrementQuantity, isInCart, getQuantity } = useCart()
  const [imgError, setImgError] = useState(false)
  const inCart = isInCart(item.id)
  const qty = getQuantity(item.id)

  const handleAdd = () => {
    addItem(item)
    toast.success(`${fallbackEmojis[item.category] || '🍽️'} ${item.name} added to cart!`, {
      duration: 2000,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col"
      data-testid="menu-card"
    >
      <div className="relative h-48 overflow-hidden">
        {!imgError ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-48 object-cover transition-transform duration-500 hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-48 bg-gradient-to-br ${
              fallbackColors[item.category] || 'from-gray-400 to-gray-500'
            } flex items-center justify-center`}
          >
            <span className="text-7xl">
              {fallbackEmojis[item.category] || '🍽️'}
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant="warning" className="text-xs font-semibold">
            {item.category}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-gray-700">{item.rating}</span>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 text-lg leading-tight">{item.name}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">{item.description}</p>

        <div className="flex items-center gap-1 mt-2">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-400">{item.prepTime}</span>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold text-primary">${item.price.toFixed(2)}</span>

          {!inCart ? (
            <Button
              onClick={handleAdd}
              size="sm"
              className="rounded-full px-5 bg-primary hover:bg-orange-600 text-white font-semibold"
              data-testid="add-btn"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          ) : (
            <div
              className="flex items-center gap-2 bg-orange-50 rounded-full px-2 py-1"
              data-testid="qty-control"
            >
              <button
                onClick={() => decrementQuantity(item.id)}
                className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
                data-testid="decrement-btn"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span
                className="w-5 text-center font-bold text-gray-800 text-sm"
                data-testid="qty-value"
              >
                {qty}
              </span>
              <button
                onClick={() => incrementQuantity(item.id)}
                className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
                data-testid="increment-btn"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
