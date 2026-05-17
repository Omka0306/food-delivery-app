import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import StarRating from './StarRating'
import { reviewsApi } from '@/services/api'
import { getCategoryEmoji } from '@/config/categories'

export default function ReviewModal({ order, onClose }) {
  const queryClient = useQueryClient()

  // Per-item rating and comment state keyed by menuItemId
  const [ratings, setRatings]   = useState({})
  const [comments, setComments] = useState({})

  const mutation = useMutation({
    mutationFn: (reviews) => Promise.all(reviews.map((r) => reviewsApi.create(r))),
    onSuccess: () => {
      toast.success('Thanks for your review!')
      queryClient.invalidateQueries({ queryKey: ['order-reviews', order.orderId] })
      onClose()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to submit review')
    },
  })

  const handleSubmit = () => {
    const items = order.items || []
    const unrated = items.filter((i) => !ratings[i.menuItemId])
    if (unrated.length > 0) {
      toast.error('Please rate all items before submitting')
      return
    }
    const reviews = items.map((i) => ({
      menuItemId: i.menuItemId,
      restaurantId: order.restaurantId,
      orderId: order.orderId,
      rating: ratings[i.menuItemId],
      comment: comments[i.menuItemId] || '',
    }))
    mutation.mutate(reviews)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-gray-800 text-lg">Rate Your Order</h2>
              <p className="text-xs text-gray-400 mt-0.5">#{order.orderId.slice(-6).toUpperCase()}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Items */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
            {(order.items || []).map((item) => {
              const emoji = getCategoryEmoji(item.category)
              return (
                <div key={item.menuItemId} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {item.name}
                        <span className="font-normal text-gray-400 ml-1">×{item.quantity}</span>
                      </p>
                    </div>
                    <StarRating
                      value={ratings[item.menuItemId] || 0}
                      onChange={(v) => setRatings((prev) => ({ ...prev, [item.menuItemId]: v }))}
                      size="md"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Add a comment (optional)…"
                    value={comments[item.menuItemId] || ''}
                    onChange={(e) => setComments((prev) => ({ ...prev, [item.menuItemId]: e.target.value }))}
                    className="w-full text-sm text-gray-700 placeholder-gray-400 border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                </div>
              )
            })}
          </div>

          {/* Submit */}
          <div className="px-5 pb-6 pt-3 border-t border-gray-100">
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
              {mutation.isPending ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
