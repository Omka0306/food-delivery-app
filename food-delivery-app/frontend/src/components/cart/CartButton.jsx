import { useEffect, useRef, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useCart from '@/hooks/useCart'

export default function CartButton() {
  const { totalItems, openCart } = useCart()
  const prevCount = useRef(totalItems)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (totalItems > prevCount.current) {
      setPulse(true)
      setTimeout(() => setPulse(false), 400)
    }
    prevCount.current = totalItems
  }, [totalItems])

  return (
    <button
      onClick={openCart}
      className="relative flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
    >
      <ShoppingBag className="w-4 h-4" />
      <span className="hidden sm:inline">Cart</span>

      <AnimatePresence>
        {totalItems > 0 && (
          <motion.span
            key={totalItems}
            initial={{ scale: 0 }}
            animate={{ scale: pulse ? 1.3 : 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-white text-primary rounded-full text-xs font-bold flex items-center justify-center shadow"
          >
            {totalItems}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
