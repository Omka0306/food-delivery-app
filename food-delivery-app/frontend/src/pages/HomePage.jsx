import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import CategoryFilter from '@/components/menu/CategoryFilter'
import MenuGrid from '@/components/menu/MenuGrid'
import useMenu from '@/hooks/useMenu'

const FOOD_EMOJIS = ['🍕', '🍔', '🍟', '🥤', '🍦', '🥗']

export default function HomePage() {
  const [category, setCategory] = useState('All')
  const { data, isLoading, isError, refetch } = useMenu(category)

  useEffect(() => {
    document.title = 'QuickBite — Order Food Online'
  }, [])

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block bg-orange-100 text-primary text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              🔥 Hot &amp; Fresh
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-4">
              Delicious Food,
              <br />
              <span className="text-primary">Delivered Fast</span>
            </h1>
            <p className="text-gray-500 text-lg mb-6 leading-relaxed">
              Fresh ingredients, restaurant quality, right to your door.
            </p>

            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">12</p>
                <p className="text-xs text-gray-400 font-medium">Menu Items</p>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">25–35</p>
                <p className="text-xs text-gray-400 font-medium">Min avg delivery</p>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">4.8★</p>
                <p className="text-xs text-gray-400 font-medium">Avg rating</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="hidden md:flex flex-wrap justify-center gap-4"
          >
            {FOOD_EMOJIS.map((emoji, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 + i * 0.3, delay: i * 0.2 }}
                className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-4xl"
              >
                {emoji}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Menu section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Our Menu</h2>
          <p className="text-gray-400 text-sm">Choose from our selection of fresh, delicious meals</p>
        </div>

        <div className="mb-6">
          <CategoryFilter active={category} onChange={setCategory} />
        </div>

        <MenuGrid data={data} isLoading={isLoading} isError={isError} refetch={refetch} />
      </section>
    </div>
  )
}
