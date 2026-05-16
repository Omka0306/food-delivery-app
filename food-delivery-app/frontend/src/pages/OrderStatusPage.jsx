import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Radio } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import OrderTracker from '@/components/order/OrderTracker'
import useOrderTracking from '@/hooks/useOrderTracking'

export default function OrderStatusPage() {
  const { orderId } = useParams()
  const { data: order, isLoading, isError, refetch, dataUpdatedAt, wsConnected } = useOrderTracking(orderId)
  const [secondsAgo, setSecondsAgo] = useState(0)

  useEffect(() => {
    document.title = 'Track Order — QuickBite'
  }, [])

  useEffect(() => {
    if (!dataUpdatedAt) return
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - dataUpdatedAt) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [dataUpdatedAt])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🛵</div>
          <p className="text-gray-500 font-medium">Loading your order...</p>
        </div>
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-5xl">😕</p>
          <h2 className="text-xl font-bold text-gray-700">Order not found</h2>
          <p className="text-gray-400 text-sm">We couldn't find order #{orderId?.slice(-6).toUpperCase()}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={refetch} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
            <Button asChild>
              <Link to="/">Back to Menu</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const lastUpdatedText = secondsAgo < 5
    ? 'just now'
    : `${secondsAgo}s ago`

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Menu
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-800">Track Your Order</h1>
            {wsConnected && (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                <Radio className="w-3 h-3 animate-pulse" /> Live
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mb-8">
            {wsConnected ? 'Real-time WebSocket updates active' : 'Polling for updates every 10 seconds'}
          </p>

          <OrderTracker order={order} lastUpdated={lastUpdatedText} />

          {order.status === 'Delivered' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white rounded-2xl shadow-md p-6 text-center"
            >
              <p className="text-2xl mb-2">⭐⭐⭐⭐⭐</p>
              <h3 className="font-bold text-gray-800 mb-1">How was your meal?</h3>
              <p className="text-gray-400 text-sm mb-4">Your feedback helps us improve</p>
              <div className="flex gap-3 justify-center">
                {['😍', '😊', '😐', '😕'].map((emoji) => (
                  <button
                    key={emoji}
                    className="text-3xl hover:scale-125 transition-transform"
                    onClick={() => {}}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div className="mt-6 text-center">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/">🍔 Order Again</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
