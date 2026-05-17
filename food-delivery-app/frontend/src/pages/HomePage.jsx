import { useEffect, useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Search, X, ChevronRight, Star, Clock } from 'lucide-react'
import CategoryFilter from '@/components/menu/CategoryFilter'
import MenuGrid from '@/components/menu/MenuGrid'
import PromoBanner from '@/components/menu/PromoBanner'
import MenuCard from '@/components/menu/MenuCard'
import useMenu from '@/hooks/useMenu'
import { restaurantApi } from '@/services/api'
import AISearchBar from '@/components/ai/AISearchBar'
import AIRecommendationResults from '@/components/ai/AIRecommendationResults'
import { useAIRecommendations } from '@/hooks/useAIRecommendations'

const VEG_FILTERS = [
  { key: 'all',    label: 'All'     },
  { key: 'veg',    label: 'Veg'     },
  { key: 'nonveg', label: 'Non-Veg' },
]

const BUDGET_THRESHOLD = 99

export default function HomePage() {
  const [category,  setCategory]  = useState('All')
  const [search,    setSearch]    = useState('')
  const [vegFilter, setVegFilter] = useState('all')
  const searchRef      = useRef(null)
  const menuSectionRef = useRef(null)
  const aiResultsRef   = useRef(null)

  const {
    recommendations, greeting, tip, context,
    isLoading: aiLoading, error: aiError,
    hasSearched, search: aiSearch, clear: aiClear,
  } = useAIRecommendations()

  useEffect(() => { document.title = 'QuickBite — Order Food Online' }, [])

  // Fetch all menu items (unfiltered) — we filter client-side
  const { data: allItems = [], isLoading, isError, refetch } = useMenu('All')

  // Fetch restaurants to show name alongside each item group
  const { data: restaurants = [] } = useQuery({
    queryKey: ['restaurants-home'],
    queryFn: async () => {
      const res = await restaurantApi.getAll({ status: 'active' })
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
  })

  // restaurantId → restaurant object lookup
  const restaurantMap = useMemo(
    () => Object.fromEntries(restaurants.map((r) => [r.restaurantId, r])),
    [restaurants]
  )

  const availableCategories = useMemo(
    () => [...new Set(allItems.map((i) => i.category).filter(Boolean))].sort(),
    [allItems]
  )

  const filteredItems = useMemo(() => {
    let items = allItems
    if (category !== 'All') items = items.filter((i) => i.category === category)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q)
      )
    }
    if (vegFilter === 'veg')    items = items.filter((i) => i.isVeg === true)
    if (vegFilter === 'nonveg') items = items.filter((i) => i.isVeg === false)
    return items
  }, [allItems, category, search, vegFilter])

  // Group items by restaurant (preserves "each order goes to one place" principle)
  const itemsByRestaurant = useMemo(() => {
    const groups = {}
    for (const item of filteredItems) {
      const rid = item.restaurantId || '__unknown__'
      if (!groups[rid]) groups[rid] = []
      groups[rid].push(item)
    }
    return groups
  }, [filteredItems])

  const budgetItems = useMemo(
    () =>
      category === 'All' && !search.trim() && vegFilter === 'all'
        ? allItems.filter((i) => i.price < BUDGET_THRESHOLD && i.available !== false)
        : [],
    [allItems, category, search, vegFilter]
  )

  const scrollToMenu = () => {
    menuSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => searchRef.current?.focus(), 400)
  }

  const handleAISearch = (query) => {
    aiSearch(query)
    setTimeout(() => aiResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
  }

  const isFiltering = category !== 'All' || search.trim() || vegFilter !== 'all'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky search bar ───────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for dosa, biryani, burger…"
              className="w-full pl-10 pr-10 py-2.5 rounded-full bg-gray-100 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all duration-200"
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => { setSearch(''); searchRef.current?.focus() }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 py-5">

        {/* ── Promo banner ────────────────────────────────── */}
        <PromoBanner onCtaClick={scrollToMenu} />

        {/* ── AI Search bar ───────────────────────────────── */}
        {import.meta.env.VITE_AI_ENABLED !== 'false' && (
          <AISearchBar onSearch={handleAISearch} isLoading={aiLoading} />
        )}

        {/* ── AI Results section ──────────────────────────── */}
        <AnimatePresence>
          {(aiLoading || aiError || hasSearched) && (
            <motion.section
              ref={aiResultsRef}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-purple-600">✨</span> AI Picks
                </h2>
                {hasSearched && !aiLoading && (
                  <button
                    onClick={aiClear}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <AIRecommendationResults
                recommendations={recommendations}
                greeting={greeting}
                tip={tip}
                context={context}
                isLoading={aiLoading}
                error={aiError}
                onRetry={() => {}}
              />
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Category filter ─────────────────────────────── */}
        <CategoryFilter
          active={category}
          categories={availableCategories}
          onChange={(c) => { setCategory(c); setSearch(''); setVegFilter('all') }}
        />

        {/* ── Veg / Non-veg toggle ────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          {VEG_FILTERS.map((f) => {
            const active = vegFilter === f.key
            return (
              <motion.button
                key={f.key}
                whileTap={{ scale: 0.94 }}
                onClick={() => setVegFilter(f.key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  active
                    ? f.key === 'veg'    ? 'bg-green-600 text-white border-green-600 shadow-sm'
                    : f.key === 'nonveg' ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    :                     'bg-gray-800 text-white border-gray-800 shadow-sm'
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
          {isFiltering && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-auto text-xs text-gray-400">
              {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
            </motion.span>
          )}
        </div>

        {/* ── Meals under ₹99 strip ───────────────────────── */}
        <AnimatePresence>
          {budgetItems.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  Meals under
                  <span className="bg-orange-100 text-primary px-2 py-0.5 rounded-lg font-extrabold">₹{BUDGET_THRESHOLD}</span>
                </h2>
                <button onClick={() => { setCategory('All'); setVegFilter('all'); setSearch('') }}
                  className="text-xs font-semibold text-primary hover:underline">See All →</button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                {budgetItems.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex-shrink-0 w-40 bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
                  >
                    <div className="relative h-24 overflow-hidden bg-orange-50">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none' }} loading="lazy" />
                      <div className="absolute bottom-1.5 left-1.5">
                        <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center bg-white ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                          <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                      <p className="text-primary font-extrabold text-sm mt-0.5">₹{item.price}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Menu — grouped by restaurant ────────────────── */}
        <section ref={menuSectionRef} className="space-y-10">
          {isLoading ? (
            <MenuGrid data={[]} isLoading isError={false} refetch={refetch} />
          ) : isError ? (
            <MenuGrid data={[]} isLoading={false} isError refetch={refetch} />
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="text-6xl">🍽️</span>
              <p className="text-gray-500 font-medium text-lg">No items found</p>
            </div>
          ) : (
            Object.entries(itemsByRestaurant)
              // Skip groups where restaurant data is unknown (restaurant not in active list)
              .filter(([rid]) => rid === '__unknown__' ? false : (restaurants.length === 0 || restaurantMap[rid]))
              .map(([rid, items], groupIdx) => {
              const restaurant = restaurantMap[rid]
              return (
                <motion.div
                  key={rid}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIdx * 0.08 }}
                >
                  {/* Restaurant header — only shown when multiple restaurants exist AND restaurant data is known */}
                  {Object.keys(itemsByRestaurant).length > 1 && restaurant && (
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl">
                          🍽️
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-gray-800">
                            {restaurant.name}
                          </h2>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {restaurant.rating > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                {restaurant.rating}
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> 25–35 min
                            </span>
                            <span className={`font-semibold ${restaurant.isOpen ? 'text-green-600' : 'text-red-400'}`}>
                              {restaurant.isOpen ? 'Open' : 'Closed'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link
                        to={`/restaurants/${rid}`}
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        Full Menu <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {/* Single restaurant — just show a simple header */}
                  {Object.keys(itemsByRestaurant).length === 1 && (
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          {search ? `Results for "${search}"` : category === 'All' ? 'Our Menu' : category}
                        </h2>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {restaurant?.name} · {items.length} items
                        </p>
                      </div>
                      <span className="text-sm text-gray-400">{items.length} items</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item, idx) => (
                      <MenuCard key={item.id} item={item} index={idx} />
                    ))}
                  </div>
                </motion.div>
              )
            })
          )}
        </section>
      </div>

    </div>
  )
}
