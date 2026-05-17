import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Star } from 'lucide-react'
import { reviewsApi } from '@/services/api'

const SENTIMENTS = [
  { emoji: '😍', label: 'Excellent', rating: 5 },
  { emoji: '😊', label: 'Good',      rating: 4 },
  { emoji: '😐', label: 'Okay',      rating: 3 },
  { emoji: '😟', label: 'Poor',      rating: 2 },
]

function FilledStars({ count }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-9 h-9 transition-all duration-200 ${
            i <= count ? 'fill-yellow-400 text-yellow-400 scale-110' : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function ReviewModal({ order, onClose }) {
  const queryClient = useQueryClient()
  const [selected,  setSelected]  = useState(null)   // index into SENTIMENTS
  const [comment,   setComment]   = useState('')
  const [submitted, setSubmitted] = useState(false)

  const rating = selected !== null ? SENTIMENTS[selected].rating : 0

  const mutation = useMutation({
    mutationFn: () =>
      reviewsApi.create({
        restaurantId: order.restaurantId,
        orderId:      order.orderId,
        rating,
        comment: comment.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-reviews', order.orderId] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-reviews', order.restaurantId] })
      setSubmitted(true)
    },
    onError: (err) => toast.error(err.message || 'Failed to submit review'),
  })

  const handleSubmit = () => {
    if (selected === null) { toast.error('Please select how you felt about your meal'); return }
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 80 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-6 pt-8 pb-6 flex flex-col items-center gap-5"
            >
              {/* Stars */}
              <FilledStars count={rating} />

              {/* Heading */}
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-gray-800">How was your meal?</h2>
                <p className="text-sm text-gray-400">Your feedback helps us improve</p>
              </div>

              {/* Emoji sentiments */}
              <div className="flex items-center justify-center gap-4 py-2">
                {SENTIMENTS.map((s, i) => (
                  <motion.button
                    key={s.label}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelected(i)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <motion.span
                      animate={{ scale: selected === i ? 1.25 : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className={`text-4xl transition-opacity ${
                        selected !== null && selected !== i ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      {s.emoji}
                    </motion.span>
                    <span className={`text-[10px] font-semibold transition-colors ${
                      selected === i ? 'text-primary' : 'text-gray-400'
                    }`}>
                      {s.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Optional comment — slides in after selection */}
              <AnimatePresence>
                {selected !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full overflow-hidden"
                  >
                    <textarea
                      rows={3}
                      placeholder="Tell us more (optional)…"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full text-sm text-gray-700 placeholder-gray-400 border border-gray-200 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="w-full space-y-2 pt-1">
                <button
                  onClick={handleSubmit}
                  disabled={mutation.isPending || selected === null}
                  className="w-full bg-primary hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-colors text-sm"
                >
                  {mutation.isPending ? 'Submitting…' : 'Submit Review'}
                </button>
                <Link
                  to="/"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-2xl transition-colors text-sm"
                >
                  🍔 Order Again
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 py-12 flex flex-col items-center gap-4 text-center"
            >
              <span className="text-6xl">🎉</span>
              <h2 className="text-xl font-bold text-gray-800">Thanks for your feedback!</h2>
              <p className="text-sm text-gray-400">Your review helps others decide what to order.</p>
              <button
                onClick={onClose}
                className="mt-2 bg-primary hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-2xl transition-colors text-sm"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
