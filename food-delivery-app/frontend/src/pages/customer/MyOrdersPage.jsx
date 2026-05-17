import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, ArrowRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ordersApi, reviewsApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import ReviewModal from '@/components/reviews/ReviewModal'

const STATUS_BADGE = {
  'Order Received':    'bg-gray-100 text-gray-700',
  Preparing:           'bg-yellow-100 text-yellow-700',
  'Out for Delivery':  'bg-purple-100 text-purple-700',
  Delivered:           'bg-green-100 text-green-700',
}

function formatItems(items) {
  return (items || []).map((i) => `${i.quantity}× ${i.name}`).join(', ')
}

function OrderCard({ order, onRate }) {
  const isDelivered = order.status === 'Delivered'
  const isActive    = !isDelivered

  // Check if this order already has reviews
  const { data: existingReviews = [] } = useQuery({
    queryKey: ['order-reviews', order.orderId],
    queryFn: async () => {
      const res = await reviewsApi.getByOrder(order.orderId)
      return res.data.data
    },
    enabled: isDelivered,
    staleTime: 60 * 1000,
  })

  const alreadyReviewed = existingReviews.length > 0

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-orange-200 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-xs text-gray-500">
              #{order.orderId.slice(-6).toUpperCase()}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-600'}`}>
              {order.status}
            </span>
          </div>
          <p className="text-gray-700 truncate text-sm">{formatItems(order.items)}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="font-bold text-gray-800">₹{order.total}</span>
            <span className="text-xs text-gray-400">
              {new Date(order.createdAt).toLocaleDateString([], {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          {isActive && (
            <Button asChild size="sm" className="bg-primary hover:bg-orange-600 rounded-xl">
              <Link to={`/order/${order.orderId}`}>
                Track <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          )}
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link to={`/order/${order.orderId}`}>View</Link>
          </Button>
          {isDelivered && (
            alreadyReviewed ? (
              <span className="flex items-center gap-1 text-xs text-green-600 font-semibold px-2 py-1.5 bg-green-50 rounded-xl justify-center">
                <Star className="w-3 h-3 fill-green-500 text-green-500" /> Reviewed
              </span>
            ) : (
              <Button
                size="sm"
                onClick={() => onRate(order)}
                className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-xl text-xs font-semibold"
                variant="ghost"
              >
                <Star className="w-3 h-3 mr-1" /> Rate Items
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default function MyOrdersPage() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [reviewOrder, setReviewOrder] = useState(null)

  useEffect(() => { document.title = 'My Orders — QuickBite' }, [])

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { state: { returnUrl: '/orders' } })
  }, [isAuthenticated, navigate])

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const res = await ordersApi.getMyOrders()
      return res.data.data
    },
    enabled: isAuthenticated,
  })

  const sorted = [...orders].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🛵</div>
          <p className="text-gray-500 font-medium">Loading your orders…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
          <span className="ml-auto text-sm text-gray-400">{sorted.length} order{sorted.length !== 1 ? 's' : ''}</span>
        </div>

        {sorted.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm space-y-4">
            <p className="text-5xl">🛒</p>
            <h2 className="text-lg font-semibold text-gray-700">No orders yet</h2>
            <p className="text-gray-400 text-sm">When you place your first order, it will appear here.</p>
            <Button asChild className="bg-primary hover:bg-orange-600 rounded-full">
              <Link to="/">Browse Menu</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((order) => (
              <OrderCard key={order.orderId} order={order} onRate={setReviewOrder} />
            ))}
          </div>
        )}
      </div>

      {reviewOrder && (
        <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} />
      )}
    </div>
  )
}
