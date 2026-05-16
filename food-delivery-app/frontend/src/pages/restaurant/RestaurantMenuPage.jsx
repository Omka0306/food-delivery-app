import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UtensilsCrossed, ToggleLeft, ToggleRight } from 'lucide-react'
import { restaurantApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

const CATEGORY_COLORS = {
  Burgers: 'bg-orange-50',
  Pizza: 'bg-red-50',
  Pasta: 'bg-yellow-50',
  Salads: 'bg-green-50',
  Desserts: 'bg-pink-50',
  Drinks: 'bg-blue-50',
  default: 'bg-gray-50',
}

const CATEGORY_EMOJI = {
  Burgers: '🍔',
  Pizza: '🍕',
  Pasta: '🍝',
  Salads: '🥗',
  Desserts: '🍰',
  Drinks: '🥤',
  default: '🍽️',
}

export default function RestaurantMenuPage() {
  const { user } = useAuthStore()
  const restaurantId = user?.restaurantId
  const [localAvailability, setLocalAvailability] = useState({})

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['restaurant-menu', restaurantId],
    queryFn: async () => {
      const res = await restaurantApi.getMenuItems(restaurantId)
      return res.data.data
    },
    enabled: !!restaurantId,
  })

  const isAvailable = (item) => {
    if (item.menuItemId in localAvailability) return localAvailability[item.menuItemId]
    return item.available !== false
  }

  const toggleAvailability = (item) => {
    setLocalAvailability((prev) => ({
      ...prev,
      [item.menuItemId]: !isAvailable(item),
    }))
  }

  const categories = [...new Set(items.map((i) => i.category || 'Other'))]

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-gray-400">
        Loading menu…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
        <UtensilsCrossed className="w-12 h-12 text-gray-200" />
        <p>No menu items found.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Menu Management</h1>
        <span className="text-sm text-gray-400">{items.length} items</span>
      </div>

      {categories.map((cat) => {
        const catItems = items.filter((i) => (i.category || 'Other') === cat)
        const bg = CATEGORY_COLORS[cat] || CATEGORY_COLORS.default
        const emoji = CATEGORY_EMOJI[cat] || CATEGORY_EMOJI.default

        return (
          <div key={cat}>
            <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>{emoji}</span> {cat}
              <span className="text-xs text-gray-400 font-normal">({catItems.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catItems.map((item) => {
                const available = isAvailable(item)
                return (
                  <div
                    key={item.menuItemId}
                    className={`rounded-2xl border overflow-hidden shadow-sm transition-opacity ${
                      available ? 'border-gray-100 opacity-100' : 'border-gray-100 opacity-60'
                    }`}
                  >
                    <div className={`h-32 flex items-center justify-center text-5xl ${bg}`}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentNode.innerText = emoji
                          }}
                        />
                      ) : (
                        emoji
                      )}
                    </div>
                    <div className="bg-white p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                          <p className="text-orange-600 font-bold mt-2">₹{item.price}</p>
                        </div>
                        <button
                          onClick={() => toggleAvailability(item)}
                          className={`flex-shrink-0 mt-0.5 transition-colors ${
                            available ? 'text-green-500 hover:text-green-600' : 'text-gray-300 hover:text-gray-400'
                          }`}
                          title={available ? 'Mark unavailable' : 'Mark available'}
                        >
                          {available
                            ? <ToggleRight className="w-8 h-8" />
                            : <ToggleLeft className="w-8 h-8" />
                          }
                        </button>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                          available ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
