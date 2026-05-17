import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { restaurantApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

const TABS = ['All', 'Pending', 'Active', 'Completed']

const STATUS_BADGE = {
  'Order Received': 'bg-gray-100 text-gray-700',
  Preparing: 'bg-yellow-100 text-yellow-700',
  'Out for Delivery': 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
}

const NEXT_STATUS = {
  'Order Received': 'Preparing',
  Preparing: 'Out for Delivery',
  'Out for Delivery': 'Delivered',
}

function matchesTab(order, tab) {
  if (tab === 'All') return true
  if (tab === 'Pending') return order.status === 'Order Received'
  if (tab === 'Active') return ['Preparing', 'Out for Delivery'].includes(order.status)
  if (tab === 'Completed') return order.status === 'Delivered'
  return true
}

function formatItems(items) {
  return (items || []).map((i) => `${i.quantity}× ${i.name}`).join(', ')
}

function OrderRow({ order, onAdvance, isPending }) {
  const [expanded, setExpanded] = useState(false)
  const next = NEXT_STATUS[order.status]

  return (
    <>
      <tr
        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 font-mono text-xs text-gray-600">
          #{order.orderId.slice(-6).toUpperCase()}
        </td>
        <td className="px-4 py-3 text-gray-700">{order.customerName}</td>
        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{formatItems(order.items)}</td>
        <td className="px-4 py-3 font-semibold text-gray-800">₹{order.total}</td>
        <td className="px-4 py-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-600'}`}>
            {order.status}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-400 text-xs">
          {new Date(order.createdAt).toLocaleString([], {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {next && (
              <button
                disabled={isPending}
                onClick={() => onAdvance(order.orderId, next)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                → {next}
              </button>
            )}
            <button
              className="text-gray-400 hover:text-gray-600 ml-1"
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-orange-50/40">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="font-semibold text-gray-700 mb-2">Order Items</p>
                <ul className="space-y-1">
                  {(order.items || []).map((item, i) => (
                    <li key={i} className="flex justify-between text-gray-600">
                      <span>{item.quantity}× {item.name}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 pt-2 border-t border-orange-100 flex justify-between font-semibold text-gray-800">
                  <span>Total</span>
                  <span>₹{order.total}</span>
                </div>
              </div>
              <div className="space-y-1.5 text-gray-600">
                <p><span className="text-gray-400">Order ID:</span> {order.orderId}</p>
                <p><span className="text-gray-400">Customer:</span> {order.customerName}</p>
                {order.deliveryAddress && (
                  <p><span className="text-gray-400">Delivery:</span> {order.deliveryAddress}</p>
                )}
                <p>
                  <span className="text-gray-400">Placed:</span>{' '}
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function RestaurantOrdersPage() {
  const { user } = useAuthStore()
  const restaurantId = user?.restaurantId
  const queryClient = useQueryClient()

  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['restaurant-orders', restaurantId],
    queryFn: async () => {
      const res = await restaurantApi.getOrders(restaurantId)
      return res.data.data
    },
    enabled: !!restaurantId,
    refetchInterval: 15000,
  })

  const advance = useMutation({
    mutationFn: ({ orderId, status }) =>
      restaurantApi.updateOrderStatus(restaurantId, orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurantId] })
      toast.success('Order status updated')
    },
    onError: (err) => toast.error(err.message || 'Failed to update status'),
  })

  const filtered = orders.filter((o) => {
    if (!matchesTab(o, tab)) return false
    if (search) {
      const q = search.toLowerCase()
      if (!o.orderId.toLowerCase().includes(q) && !o.customerName?.toLowerCase().includes(q)) return false
    }
    if (dateFilter) {
      const orderDate = new Date(o.createdAt).toISOString().slice(0, 10)
      if (orderDate !== dateFilter) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Orders</h1>
        <span className="text-sm text-gray-400">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or customer…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Time', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Loading orders…</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No orders match your filters</td></tr>
              ) : (
                sorted.map((order) => (
                  <OrderRow
                    key={order.orderId}
                    order={order}
                    onAdvance={(orderId, status) => advance.mutate({ orderId, status })}
                    isPending={advance.isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
