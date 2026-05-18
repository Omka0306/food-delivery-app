import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import OrderSummary from '@/components/checkout/OrderSummary'
import useCart from '@/hooks/useCart'

export default function CheckoutPage() {
  const { items } = useCart()
  const navigate = useNavigate()
  const [promo, setPromo] = useState(null) // { code, discount, freeDelivery }

  useEffect(() => {
    document.title = 'Checkout — QuickBite'
  }, [])

  useEffect(() => {
    if (items.length === 0) navigate('/')
  }, [items.length, navigate])

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Menu
          </Link>

          <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <CheckoutForm promo={promo} />
            </div>
            <div className="lg:col-span-2">
              <OrderSummary onPromoChange={setPromo} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
