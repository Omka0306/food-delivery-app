import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, ShoppingBag, Store, Users, DollarSign } from 'lucide-react'
import { adminApi } from '@/services/api'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-3xl font-bold text-gray-800 mb-1">{value ?? '—'}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  useEffect(() => { document.title = 'Analytics — Admin | QuickBite' }, [])

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await adminApi.getAnalytics()
      return res.data.data
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-gray-400">
        Loading analytics…
      </div>
    )
  }

  const revenue = analytics?.revenue ?? 0
  const totalOrders = analytics?.totalOrders ?? 0
  const avgOrderValue = totalOrders > 0 ? Math.round(revenue / totalOrders) : 0

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Platform Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`₹${revenue.toLocaleString()}`}
          color="bg-green-500"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={totalOrders.toLocaleString()}
          color="bg-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg. Order Value"
          value={`₹${avgOrderValue}`}
          color="bg-orange-500"
        />
        <StatCard
          icon={Store}
          label="Active Restaurants"
          value={analytics?.totalRestaurants ?? '—'}
          color="bg-purple-500"
        />
        <StatCard
          icon={Users}
          label="Registered Users"
          value={analytics?.totalUsers ?? '—'}
          color="bg-pink-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Delivery Rate"
          value={analytics?.deliveryRate != null ? `${analytics.deliveryRate}%` : '—'}
          sub="Orders delivered on time"
          color="bg-teal-500"
        />
      </div>

      {analytics?.ordersByStatus && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {Object.entries(analytics.ordersByStatus).map(([status, count]) => {
              const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{status}</span>
                    <span className="font-semibold text-gray-800">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
