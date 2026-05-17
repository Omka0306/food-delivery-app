import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Store, ClipboardList, TrendingUp } from 'lucide-react'
import { adminApi, restaurantApi } from '@/services/api'

const STATUS_BADGE = {
  'Order Received': 'bg-gray-100 text-gray-700',
  Preparing: 'bg-yellow-100 text-yellow-700',
  'Out for Delivery': 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

export default function AdminDashboard() {
  useEffect(() => { document.title = 'Admin Dashboard — QuickBite' }, [])

  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await adminApi.getAnalytics()
      return res.data.data
    },
  })

  const { data: restaurants = [] } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: async () => {
      const res = await adminApi.getRestaurants()
      return res.data.data
    },
  })

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await adminApi.getOrders()
      return res.data.data
    },
  })

  const pending = restaurants.filter((r) => r.status === 'pending' || !r.approved)
  const recentOrders = [...orders]
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
    .slice(0, 8)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Dashboard Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Total Orders" value={analytics?.totalOrders} color="bg-blue-500" />
        <StatCard icon={TrendingUp} label="Revenue" value={analytics?.revenue != null ? `₹${analytics.revenue}` : null} color="bg-green-500" />
        <StatCard icon={Store} label="Restaurants" value={analytics?.totalRestaurants ?? restaurants.length} color="bg-orange-500" />
        <StatCard icon={Users} label="Users" value={analytics?.totalUsers} color="bg-purple-500" />
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            Pending Approvals
            <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-bold animate-pulse">
              {pending.length}
            </span>
          </h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.restaurantId} className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-800">{r.name}</p>
                  <p className="text-sm text-gray-500">{r.address}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-50 text-orange-600">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Recent Orders</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Order ID', 'Customer', 'Amount', 'Status', 'Time'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No orders yet</td></tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.orderId} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">#{order.orderId.slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-3 text-gray-700">{order.customerName}</td>
                      <td className="px-4 py-3 font-semibold">₹{order.total}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-600'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
