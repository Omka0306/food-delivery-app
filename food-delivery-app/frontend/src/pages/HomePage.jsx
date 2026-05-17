import { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Leaf, Drumstick } from 'lucide-react'
import CategoryFilter from '@/components/menu/CategoryFilter'
import MenuGrid from '@/components/menu/MenuGrid'
import PromoBanner from '@/components/menu/PromoBanner'
import MenuCard from '@/components/menu/MenuCard'
import useMenu from '@/hooks/useMenu'

// Veg filter options
const VEG_FILTERS = [
  { key: 'all',     label: 'All',     icon: null },
  { key: 'veg',     label: 'Veg',     icon: 'veg'  },
  { key: 'nonveg',  label: 'Non-Veg', icon: 'nonveg' },
]

const BUDGET_THRESHOLD = 99

export default function HomePage() {
  const [category, setCategory]   = useState('All')
  const [search,   setSearch]     = useState('')
  const [vegFilter, setVegFilter] = useState('all')
  const searchRef                 = useRef(null)
  const menuSectionRef            = useRef(null)

  // Fetch all items once (category='All') and filter client-side
  // so the category tabs reflect what's actually in the menu
  const { data: allItems = [], isLoading, isError, refetch } = useMenu('All')

  const availableCategories = useMemo(
    () => [...new Set(allItems.map((i) => i.category).filter(Boolean))].sort(),
    [allItems]
  )

  useEffect(() => {
    document.title = 'QuickBite — Order Food Online'
  }, [])

  // Client-side filtering — category + search + veg all applied locally
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

  // Budget section — only shown when no active search/veg filter and on "All" category
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

  const clearSearch = () => {
    setSearch('')
    searchRef.current?.focus()
  }

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
              placeholder="Search for pizza, burgers, drinks…"
              className="w-full pl-10 pr-10 py-2.5 rounded-full bg-gray-100 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all duration-200"
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={clearSearch}
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

        {/* ── Animated promo banner ───────────────────── */}
        <PromoBanner onCtaClick={scrollToMenu} />

        {/* ── Category filter (circular, dynamic) ────── */}
        <div>
          <CategoryFilter
            active={category}
            categories={availableCategories}
            onChange={(c) => { setCategory(c); setSearch(''); setVegFilter('all') }}
          />
        </div>

        {/* ── Veg / Non-veg toggle ────────────────────── */}
        <div className="flex items-center gap-2">
          {VEG_FILTERS.map((f) => {
            const active = vegFilter === f.key
            return (
              <motion.button
                key={f.key}
                whileTap={{ scale: 0.94 }}
                onClick={() => setVegFilter(f.key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  active
                    ? f.key === 'veg'
                      ? 'bg-green-600 text-white border-green-600 shadow-sm'
                      : f.key === 'nonveg'
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-gray-800 text-white border-gray-800 shadow-sm'
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

          {/* Active filter count pill */}
          {(search || vegFilter !== 'all') && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-auto text-xs text-gray-400"
            >
              {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
            </motion.span>
          )}
        </div>

        {/* ── Meals under ₹99 horizontal section ─────── */}
        <AnimatePresence>
          {budgetItems.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  Meals under
                  <span className="bg-orange-100 text-primary px-2 py-0.5 rounded-lg font-extrabold">₹{BUDGET_THRESHOLD}</span>
                </h2>
                <button
                  onClick={() => { setCategory('All'); setVegFilter('all'); setSearch('') }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  See All →
                </button>
              </div>

              {/* Horizontal scroll strip */}
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                {budgetItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex-shrink-0 w-40 bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
                  >
                    <div className="relative h-24 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none' }}
                        loading="lazy"
                      />
                      {/* Veg dot */}
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

        {/* ── Full menu grid ──────────────────────────── */}
        <section ref={menuSectionRef}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {search ? `Results for "${search}"` : category === 'All' ? 'Our Menu' : category}
              </h2>
              {!search && (
                <p className="text-gray-400 text-xs mt-0.5">
                  Fresh ingredients, restaurant quality, right to your door
                </p>
              )}
            </div>
            <span className="text-sm text-gray-400 font-medium">{filteredItems.length} items</span>
          </div>

          <MenuGrid
            data={filteredItems}
            isLoading={isLoading}
            isError={isError}
            refetch={refetch}
          />
        </section>
      </div>
    </div>
  )
}
