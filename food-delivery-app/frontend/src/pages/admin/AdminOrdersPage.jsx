import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { adminApi } from '@/services/api'

const STATUS_BADGE = {
  'Order Received': 'bg-gray-100 text-gray-700',
  Preparing: 'bg-yellow-100 text-yellow-700',
  'Out for Delivery': 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
}

const STATUS_FILTERS = ['All', 'Order Received', 'Preparing', 'Out for Delivery', 'Delivered']

function formatItems(items) {
  return (items || []).map((i) => `${i.quantity}× ${i.name}`).join(', ')
}

export default function AdminOrdersPage() {
  useEffect(() => { document.title = 'Orders — Admin | QuickBite' }, [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await adminApi.getOrders()
      return res.data.data
    },
  })

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'All' && o.status !== statusFilter) return false
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
        <h1 className="text-xl font-bold text-gray-800">All Orders</h1>
        <span className="text-sm text-gray-400">{sorted.length} order{sorted.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or customer…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          {STATUS_FILTERS.map((s) => <option key={s}>{s}</option>)}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

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
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Loading…</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No orders match your filters</td></tr>
              ) : (
                sorted.map((order) => (
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
                      {new Date(order.createdAt).toLocaleString([], {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
