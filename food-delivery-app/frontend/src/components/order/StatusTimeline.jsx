import { motion } from 'framer-motion'
import { CheckCircle, Circle, Loader2 } from 'lucide-react'

const STEPS = [
  {
    status: 'Order Received',
    emoji: '📋',
    message: "We've received your order and confirming with the restaurant",
  },
  {
    status: 'Preparing',
    emoji: '👨‍🍳',
    message: 'The restaurant is preparing your delicious food',
  },
  {
    status: 'Out for Delivery',
    emoji: '🛵',
    message: 'Your order is on its way!',
  },
  {
    status: 'Delivered',
    emoji: '✅',
    message: 'Your food has been delivered. Enjoy your meal!',
  },
]

const STATUS_ORDER = STEPS.map((s) => s.status)

export default function StatusTimeline({ statusHistory, currentStatus }) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)

  const getHistoryEntry = (status) =>
    statusHistory?.find((h) => h.status === status)

  return (
    <div className="space-y-0">
      {STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex
        const isCurrent = index === currentIndex
        const entry = getHistoryEntry(step.status)

        return (
          <div key={step.status} className="flex gap-4">
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.15, type: 'spring', stiffness: 300 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isCurrent
                    ? 'border-primary bg-orange-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {isCompleted && (!isCurrent || currentStatus === 'Delivered') ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : isCurrent ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="text-primary"
                  >
                    <Loader2 className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
              </motion.div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-0.5 h-12 mt-1 transition-colors duration-500 ${
                    index < currentIndex ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 + 0.1 }}
              className={`pb-8 ${index === STEPS.length - 1 ? 'pb-0' : ''}`}
            >
              <p className={`font-bold text-sm ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                {step.emoji} {step.status}
              </p>
              <p className={`text-xs mt-0.5 ${isCompleted ? 'text-gray-500' : 'text-gray-300'}`}>
                {step.message}
              </p>
              {entry?.timestamp && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </p>
              )}
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
