import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/services/api'
import useActiveOrderStore from '@/store/activeOrderStore'

const STATUS_CONFIG = {
  'Order Received': { emoji: '📋', label: 'Order received',     progress: 10,  color: 'from-blue-500 to-blue-600' },
  Preparing:        { emoji: '👨‍🍳', label: 'Preparing your food', progress: 40,  color: 'from-amber-500 to-orange-500' },
  'Out for Delivery': { emoji: '🛵', label: 'Out for delivery',  progress: 75,  color: 'from-primary to-orange-500' },
  Delivered:        { emoji: '✅', label: 'Delivered!',          progress: 100, color: 'from-green-500 to-emerald-500' },
}

export default function LiveOrderBar() {
  const navigate    = useNavigate()
  const location    = useLocation()
  const { orderId, clearActiveOrder } = useActiveOrderStore()
  const deliveredTimer = useRef(null)

  // Don't show on the order status page itself
  const onOrderPage = location.pathname.startsWith('/order/')

  const { data: order } = useQuery({
    queryKey: ['live-order', orderId],
    queryFn: async () => {
      const res = await ordersApi.getById(orderId)
      return res.data.data
    },
    enabled: !!orderId && !onOrderPage,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'Delivered' ? false : 15_000
    },
    staleTime: 10_000,
  })

  // Auto-clear 6 seconds after delivery
  useEffect(() => {
    if (order?.status === 'Delivered') {
      deliveredTimer.current = setTimeout(clearActiveOrder, 6000)
    }
    return () => clearTimeout(deliveredTimer.current)
  }, [order?.status, clearActiveOrder])

  const cfg     = STATUS_CONFIG[order?.status] || STATUS_CONFIG['Order Received']
  const shortId = order?.orderId?.slice(-6).toUpperCase()
  const itemSummary = order?.items
    ? order.items.slice(0, 2).map((i) => i.name).join(', ') +
      (order.items.length > 2 ? ` +${order.items.length - 2}` : '')
    : ''

  const visible = !!orderId && !!order && !onOrderPage

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{    y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 sm:px-6 sm:pb-4"
        >
          <div
            onClick={() => navigate(`/order/${orderId}`)}
            className={`relative w-full max-w-2xl mx-auto rounded-2xl bg-gradient-to-r ${cfg.color} shadow-2xl cursor-pointer overflow-hidden`}
          >
            {/* Progress strip at top */}
            <div className="absolute top-0 left-0 h-1 bg-white/20 w-full" />
            <motion.div
              className="absolute top-0 left-0 h-1 bg-white/60"
              initial={{ width: 0 }}
              animate={{ width: `${cfg.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />

            {/* Content */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Status emoji */}
              <motion.span
                key={order?.status}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                className="text-2xl flex-shrink-0"
              >
                {cfg.emoji}
              </motion.span>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">{cfg.label}</p>
                {itemSummary && (
                  <p className="text-white/75 text-xs truncate mt-0.5">{itemSummary}</p>
                )}
              </div>

              {/* Order ID */}
              <span className="hidden sm:block text-white/60 text-xs font-mono flex-shrink-0">
                #{shortId}
              </span>

              {/* Track CTA */}
              <div className="flex items-center gap-1 bg-white/20 hover:bg-white/30 transition-colors rounded-xl px-3 py-1.5 flex-shrink-0">
                <span className="text-white text-xs font-bold">Track</span>
                <ChevronRight className="w-3.5 h-3.5 text-white" />
              </div>

              {/* Dismiss */}
              <button
                onClick={(e) => { e.stopPropagation(); clearActiveOrder() }}
                className="text-white/60 hover:text-white transition-colors flex-shrink-0 p-1"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
