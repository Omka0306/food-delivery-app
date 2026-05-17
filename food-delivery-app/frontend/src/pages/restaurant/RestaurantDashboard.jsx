import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrendingUp, ShoppingBag, Clock, DollarSign, Bell, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { restaurantApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { playNewOrderSound } from '@/utils/sounds'

function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0)
  const startRef = useRef(null)

  useEffect(() => {
    if (target === 0) return setValue(0)
    startRef.current = null
    const step = (ts) => {
      if (!startRef.current) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      setValue(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
      else setValue(target)
    }
    const id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [target, duration])

  return value
}

const NEXT_STATUS = {
  'Order Received': 'Preparing',
  Preparing: 'Out for Delivery',
  'Out for Delivery': 'Delivered',
}

const STATUS_BADGE = {
  'Order Received': 'bg-gray-100 text-gray-700',
  Preparing: 'bg-yellow-100 text-yellow-700',
  'Out for Delivery': 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
}

function StatCard({ icon: Icon, label, value, prefix = '', color }) {
  const display = useCountUp(value)
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-800">
        {prefix}{typeof value === 'number' ? display.toLocaleString() : value}
      </p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function AcceptModal({ order, onClose, onAccept }) {
  const [prepTime, setPrepTime] = useState(20)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="font-bold text-gray-800 mb-2">Accept Order</h3>
        <p className="text-sm text-gray-500 mb-4">Set estimated preparation time:</p>
        <div className="flex gap-2 mb-5">
          {[10, 15, 20, 30].map((t) => (
            <button
              key={t}
              onClick={() => setPrepTime(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                prepTime === t
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'border-gray-200 text-gray-600 hover:border-orange-300'
              }`}
            >
              {t} min
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-green-500 hover:bg-green-600" onClick={() => onAccept(prepTime)}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  )
}

function RejectModal({ onClose, onReject }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="font-bold text-gray-800 mb-2">Reject Order</h3>
        <p className="text-sm text-gray-500 mb-3">Please provide a reason:</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Item out of stock, closing soon…"
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 mb-4"
        />
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-red-500 hover:bg-red-600"
            disabled={!reason.trim()}
            onClick={() => onReject(reason)}
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function RestaurantDashboard() {
  const { user } = useAuthStore()
  const restaurantId = user?.restaurantId
  const queryClient = useQueryClient()

  const [acceptTarget, setAcceptTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [localRejected, setLocalRejected] = useState([])

  useEffect(() => { document.title = 'Restaurant Dashboard — QuickBite' }, [])

  const { data: orders = [] } = useQuery({
    queryKey: ['restaurant-orders', restaurantId],
    queryFn: async () => {
      const res = await restaurantApi.getOrders(restaurantId)
      return res.data.data
    },
    enabled: !!restaurantId,
    refetchInterval: 15000,
  })

  const { data: analytics } = useQuery({
    queryKey: ['restaurant-analytics', restaurantId],
    queryFn: async () => {
      const res = await restaurantApi.getAnalytics(restaurantId)
      return res.data.data
    },
    enabled: !!restaurantId,
  })

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }) =>
      restaurantApi.updateOrderStatus(restaurantId, orderId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurantId] }),
    onError: (err) => toast.error(err.message || 'Failed to update status'),
  })

  useWebSocket((data) => {
    if (data.type === 'NEW_ORDER') {
      playNewOrderSound()
      toast.success('🔔 New order received!', { duration: 5000 })
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurantId] })
    }
  })

  const pending = orders.filter(
    (o) => o.status === 'Order Received' && !localRejected.includes(o.orderId)
  )
  const active = orders.filter((o) =>
    ['Preparing', 'Out for Delivery'].includes(o.status)
  )
  const recent = [...orders].sort((a, b) => b.createdAt > a.createdAt ? 1 : -1).slice(0, 10)

  const handleAccept = (prepTime) => {
    if (!acceptTarget) return
    updateStatus.mutate({ orderId: acceptTarget.orderId, status: 'Preparing' })
    toast.success(`Order accepted! Estimated prep: ${prepTime} min`)
    setAcceptTarget(null)
  }

  const handleReject = (reason) => {
    if (!rejectTarget) return
    setLocalRejected((r) => [...r, rejectTarget.orderId])
    toast.error(`Order rejected: ${reason}`)
    setRejectTarget(null)
  }

  const formatItems = (items) =>
    (items || []).map((i) => `${i.quantity}× ${i.name}`).join(', ')

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-cards">
        <StatCard icon={ShoppingBag} label="Total Orders" value={analytics?.totalOrders ?? 0} color="bg-blue-500" />
        <StatCard icon={DollarSign} label="Revenue" value={analytics?.revenue ?? 0} prefix="₹" color="bg-green-500" />
        <StatCard icon={Bell} label="Pending" value={pending.length} color="bg-orange-500" />
        <StatCard icon={TrendingUp} label="Rating" value={analytics?.rating ?? 0} color="bg-purple-500" />
      </div>

      {/* Pending orders */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-gray-800">Pending Orders</h2>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-bold animate-pulse">
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
            No pending orders right now 🎉
          </div>
        ) : (
          <div className="space-y-3" data-testid="pending-orders">
            {pending.map((order) => (
              <div key={order.orderId} className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">
                      #{order.orderId.slice(-6).toUpperCase()} · {order.customerName}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{formatItems(order.items)}</p>
                    <p className="text-sm font-bold text-primary mt-1">₹{order.total}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                      onClick={() => setAcceptTarget(order)}
                      data-testid="accept-btn"
                    >
                      <Check className="w-4 h-4 mr-1" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-500 hover:bg-red-50 rounded-xl"
                      onClick={() => setRejectTarget(order)}
                      data-testid="reject-btn"
                    >
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active orders */}
      {active.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Active Orders</h2>
          <div className="space-y-3">
            {active.map((order) => (
              <div key={order.orderId} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-800">#{order.orderId.slice(-6).toUpperCase()}</p>
                    <p className="text-sm text-gray-500">{order.customerName}</p>
                    <span className={`mt-1 inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  {NEXT_STATUS[order.status] && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus.mutate({ orderId: order.orderId, status: NEXT_STATUS[order.status] })}
                      className="bg-primary hover:bg-orange-600 rounded-xl"
                      disabled={updateStatus.isPending}
                    >
                      → {NEXT_STATUS[order.status]}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders table */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Orders</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Time'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr key={order.orderId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">#{order.orderId.slice(-6).toUpperCase()}</td>
                    <td className="px-4 py-3 text-gray-700">{order.customerName}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{formatItems(order.items)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">₹{order.total}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {acceptTarget && <AcceptModal order={acceptTarget} onClose={() => setAcceptTarget(null)} onAccept={handleAccept} />}
      {rejectTarget && <RejectModal onClose={() => setRejectTarget(null)} onReject={handleReject} />}
    </div>
  )
}
