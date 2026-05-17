import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Star, Clock, ChevronRight, Search, UtensilsCrossed } from 'lucide-react'
import { restaurantApi } from '@/services/api'

const CUISINES = ['All', 'American', 'Italian', 'Indian', 'Chinese', 'Mexican', 'Other']

const CUISINE_EMOJI = {
  American: '🍔', Italian: '🍕', Indian: '🍛',
  Chinese: '🥡', Mexican: '🌮', Other: '🍽️',
}

function RestaurantCard({ restaurant, index }) {
  const [imgError, setImgError] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      whileHover={{ y: -4 }}
    >
      <Link to={`/restaurants/${restaurant.restaurantId}`} className="block">
        <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
          {/* Cover image */}
          <div className="relative h-40 bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center overflow-hidden">
            {restaurant.imageUrl && !imgError ? (
              <img
                src={restaurant.imageUrl}
                alt={restaurant.name}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-6xl">
                {CUISINE_EMOJI[restaurant.cuisine] || '🍽️'}
              </span>
            )}
            {/* Open/Closed badge */}
            <div className="absolute top-3 right-3">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  restaurant.isOpen
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-400 text-white'
                }`}
              >
                {restaurant.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 text-base truncate">{restaurant.name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{restaurant.cuisine} cuisine</p>
              </div>
              <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg flex-shrink-0">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold text-gray-700">{restaurant.rating || '4.0'}</span>
              </div>
            </div>

            {restaurant.description && (
              <p className="text-xs text-gray-400 mt-2 line-clamp-2">{restaurant.description}</p>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>25–35 min</span>
              </div>
              <span className="text-xs font-semibold text-primary flex items-center gap-1">
                View Menu <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function RestaurantsPage() {
  const [cuisine, setCuisine] = useState('All')
  const [search, setSearch]   = useState('')

  useEffect(() => { document.title = 'Restaurants — QuickBite' }, [])

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const res = await restaurantApi.getAll({ status: 'active' })
      return res.data.data
    },
    staleTime: 2 * 60 * 1000,
  })

  const filtered = restaurants.filter((r) => {
    const matchCuisine = cuisine === 'All' || r.cuisine === cuisine
    const matchSearch  = !search.trim() || r.name.toLowerCase().includes(search.toLowerCase())
    return matchCuisine && matchSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Restaurants near you</h1>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search restaurants…"
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-gray-100 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all"
            />
          </div>
          {/* Cuisine filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CUISINES.map((c) => (
              <button
                key={c}
                onClick={() => setCuisine(c)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                  cuisine === c
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                }`}
              >
                {c !== 'All' ? `${CUISINE_EMOJI[c] || ''} ` : ''}{c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
            <UtensilsCrossed className="w-12 h-12 text-gray-200" />
            <p className="font-medium">No restaurants found</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">{filtered.length} restaurant{filtered.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((r, i) => (
                <RestaurantCard key={r.restaurantId} restaurant={r} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
