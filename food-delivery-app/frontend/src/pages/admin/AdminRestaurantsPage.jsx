import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '@/services/api'

const STATUS_BADGE = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
}

export default function AdminRestaurantsPage() {
  useEffect(() => { document.title = 'Restaurants — Admin | QuickBite' }, [])

  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: async () => {
      const res = await adminApi.getRestaurants()
      return res.data.data
    },
  })

  const approve = useMutation({
    mutationFn: (id) => adminApi.approveRestaurant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] })
      toast.success('Restaurant approved')
    },
    onError: (err) => toast.error(err.message || 'Failed to approve'),
  })

  const suspend = useMutation({
    mutationFn: (id) => adminApi.suspendRestaurant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] })
      toast.success('Restaurant suspended')
    },
    onError: (err) => toast.error(err.message || 'Failed to suspend'),
  })

  const filtered = restaurants.filter((r) => {
    if (search) {
      const q = search.toLowerCase()
      if (!r.name?.toLowerCase().includes(q) && !r.address?.toLowerCase().includes(q)) return false
    }
    if (filter === 'pending' && r.status !== 'pending' && r.approved !== false) return false
    if (filter === 'active' && r.status !== 'active') return false
    if (filter === 'suspended' && r.status !== 'suspended') return false
    return true
  })

  const getStatus = (r) => r.status || (r.approved ? 'active' : 'pending')

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Restaurants</h1>
        <span className="text-sm text-gray-400">{filtered.length} shown</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurants…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {['all', 'pending', 'active', 'suspended'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Name', 'Cuisine', 'Address', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No restaurants found</td></tr>
              ) : (
                filtered.map((r) => {
                  const status = getStatus(r)
                  return (
                    <tr key={r.restaurantId} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-800">{r.name}</td>
                      <td className="px-4 py-3 text-gray-500">{r.cuisine || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{r.address || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {status !== 'active' && (
                            <button
                              onClick={() => approve.mutate(r.restaurantId)}
                              disabled={approve.isPending}
                              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}
                          {status !== 'suspended' && (
                            <button
                              onClick={() => suspend.mutate(r.restaurantId)}
                              disabled={suspend.isPending}
                              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
