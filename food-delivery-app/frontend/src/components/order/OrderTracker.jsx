import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Progress } from '@/components/ui/progress'
import StatusBadge from './StatusBadge'
import StatusTimeline from './StatusTimeline'

const STATUS_PROGRESS = {
  'Order Received': 10,
  Preparing: 40,
  'Out for Delivery': 75,
  Delivered: 100,
}

export default function OrderTracker({ order, lastUpdated }) {
  const [showDetails, setShowDetails] = useState(false)
  const confettiFired = useRef(false)

  useEffect(() => {
    if (order.status === 'Delivered' && !confettiFired.current) {
      confettiFired.current = true
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } })
    }
  }, [order.status])

  const shortId = order.orderId.slice(-6).toUpperCase()
  const progress = STATUS_PROGRESS[order.status] || 0

  return (
    <div className="space-y-6">
      {order.status === 'Delivered' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center"
        >
          <p className="text-green-700 font-bold text-lg">🎉 Order Delivered!</p>
          <p className="text-green-600 text-sm">We hope you enjoyed your meal. Rate your experience below!</p>
        </motion.div>
      )}

      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Order ID</p>
            <p className="font-bold text-gray-800 text-lg">#ORD-{shortId}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Order Received</span>
            <span>Preparing</span>
            <span>On the Way</span>
            <span>Delivered</span>
          </div>
          <Progress value={progress} className="h-3 rounded-full" />
        </div>

        <div className="bg-orange-50 rounded-xl p-4 mb-6 text-center">
          <p className="text-gray-500 text-sm">Hey <strong>{order.customerName}</strong>, your food is on its way! 🎉</p>
          <p className="text-gray-400 text-xs mt-1">Estimated delivery: 25–35 minutes</p>
        </div>

        <StatusTimeline statusHistory={order.statusHistory} currentStatus={order.status} />

        {lastUpdated && (
          <p className="text-xs text-gray-400 text-right mt-4">
            Last updated: {lastUpdated}
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="w-full px-6 py-4 flex items-center justify-between text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          <span>🧾 View Order Details</span>
          <span className="text-gray-400">{showDetails ? '▲' : '▼'}</span>
        </button>

        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-6 pb-6 border-t border-gray-100"
          >
            {/* Items */}
            <div className="pt-4 space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-gray-600">
                  <span>{item.name} × {item.quantity}</span>
                  <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Bill breakdown */}
            <div className="border-t border-dashed mt-3 pt-3 space-y-1.5 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{(order.pricing?.subtotal ?? order.total).toFixed(2)}</span>
              </div>
              {order.pricing ? (
                <>
                  <div className="flex justify-between">
                    <span>GST (5%)</span>
                    <span>₹{order.pricing.gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform fee</span>
                    <span>₹{order.pricing.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery fee</span>
                    {order.pricing.deliveryFee === 0
                      ? <span className="text-green-600 font-semibold">FREE</span>
                      : <span>₹{order.pricing.deliveryFee.toFixed(2)}</span>}
                  </div>
                  {order.pricing.discount > 0 && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Discount{order.promoCode ? ` (${order.promoCode})` : ''}</span>
                      <span>−₹{order.pricing.discount.toFixed(2)}</span>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="border-t mt-3 pt-3 flex justify-between font-bold text-gray-800">
              <span>Total</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
