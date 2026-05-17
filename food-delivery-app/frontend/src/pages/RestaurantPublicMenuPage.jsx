import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, Clock, MapPin, MessageSquare } from 'lucide-react'
import { restaurantApi, reviewsApi } from '@/services/api'
import CategoryFilter from '@/components/menu/CategoryFilter'
import MenuGrid from '@/components/menu/MenuGrid'
import ReviewList from '@/components/reviews/ReviewList'

const VEG_FILTERS = [
  { key: 'all',    label: 'All'     },
  { key: 'veg',    label: 'Veg'     },
  { key: 'nonveg', label: 'Non-Veg' },
]

export default function RestaurantPublicMenuPage() {
  const { restaurantId } = useParams()
  const [category,   setCategory]   = useState('All')
  const [vegFilter,  setVegFilter]  = useState('all')
  const [tab, setTab] = useState('menu') // 'menu' | 'reviews'

  const { data: restaurant, isLoading: loadingInfo } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => {
      const res = await restaurantApi.getById(restaurantId)
      return res.data.data
    },
    enabled: !!restaurantId,
  })

  const { data: allItems = [], isLoading: loadingMenu, isError, refetch } = useQuery({
    queryKey: ['restaurant-public-menu', restaurantId],
    queryFn: async () => {
      const res = await restaurantApi.getMenuItems(restaurantId)
      return res.data.data
    },
    enabled: !!restaurantId,
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ['restaurant-reviews', restaurantId],
    queryFn: async () => {
      const res = await reviewsApi.getByRestaurant(restaurantId)
      return res.data.data
    },
    enabled: !!restaurantId,
    staleTime: 2 * 60 * 1000,
  })

  useEffect(() => {
    if (restaurant?.name) document.title = `${restaurant.name} — QuickBite`
  }, [restaurant?.name])

  const availableCategories = useMemo(
    () => [...new Set(allItems.map((i) => i.category).filter(Boolean))].sort(),
    [allItems]
  )

  const filteredItems = useMemo(() => {
    let items = allItems
    if (category !== 'All') items = items.filter((i) => i.category === category)
    if (vegFilter === 'veg')    items = items.filter((i) => i.isVeg === true)
    if (vegFilter === 'nonveg') items = items.filter((i) => i.isVeg === false)
    return items
  }, [allItems, category, vegFilter])

  if (loadingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-gray-400">
        <p className="font-medium">Restaurant not found</p>
        <Link to="/restaurants" className="text-primary text-sm hover:underline">← Back to restaurants</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant banner */}
      <div className="relative bg-gradient-to-br from-orange-600 to-amber-500 h-48 sm:h-60 overflow-hidden">
        {restaurant.imageUrl && (
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8">
          <Link
            to="/restaurants"
            className="absolute top-4 left-4 w-9 h-9 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  restaurant.isOpen ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}
              >
                {restaurant.isOpen ? 'Open Now' : 'Closed'}
              </span>
              <span className="text-white/70 text-xs">{restaurant.cuisine} cuisine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow">{restaurant.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-white/90 text-xs">
                <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                <span className="font-semibold">{restaurant.rating || '4.0'}</span>
              </div>
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>25–35 min delivery</span>
              </div>
              {restaurant.address && (
                <div className="hidden sm:flex items-center gap-1 text-white/80 text-xs">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate max-w-xs">{restaurant.address}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Menu / Reviews tab bar */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {[
            { key: 'menu', label: 'Menu', icon: null },
            { key: 'reviews', label: `Reviews${reviews.length > 0 ? ` (${reviews.length})` : ''}`, icon: MessageSquare },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                tab === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
        </div>

        {tab === 'menu' ? (
          <>
            {/* Category + Veg filters */}
            <CategoryFilter
              active={category}
              categories={availableCategories}
              onChange={(c) => { setCategory(c); setVegFilter('all') }}
            />

            <div className="flex items-center gap-2">
              {VEG_FILTERS.map((f) => {
                const active = vegFilter === f.key
                return (
                  <motion.button
                    key={f.key}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setVegFilter(f.key)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      active
                        ? f.key === 'veg'
                          ? 'bg-green-600 text-white border-green-600'
                          : f.key === 'nonveg'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {f.key === 'veg' && (
                      <span className={`w-3 h-3 rounded-sm border flex items-center justify-center ${active ? 'border-white' : 'border-green-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-green-600'}`} />
                      </span>
                    )}
                    {f.key === 'nonveg' && (
                      <span className={`w-3 h-3 rounded-sm border flex items-center justify-center ${active ? 'border-white' : 'border-red-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-red-600'}`} />
                      </span>
                    )}
                    {f.label}
                  </motion.button>
                )
              })}
              <span className="ml-auto text-xs text-gray-400">{filteredItems.length} items</span>
            </div>

            <MenuGrid
              data={filteredItems}
              isLoading={loadingMenu}
              isError={isError}
              refetch={refetch}
            />
          </>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Customer Reviews
            </h3>
            <ReviewList reviews={reviews} emptyMessage="No reviews yet. Be the first to review!" />
          </div>
        )}
      </div>
    </div>
  )
}
