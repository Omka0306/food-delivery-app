import { useState } from 'react'
import { Tag, X, Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import useCart from '@/hooks/useCart'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/services/apiClient'

const DELIVERY_FEE = 40
const FREE_DELIVERY_THRESHOLD = 499
const GST_RATE = 0.05
const PLATFORM_FEE = 10

export default function OrderSummary({ onPromoChange }) {
  const { items, totalPrice } = useCart()
  const { user } = useAuthStore()

  const [couponInput, setCouponInput]   = useState('')
  const [promo,       setPromo]         = useState(null)   // { code, discount, freeDelivery, description }
  const [couponError, setCouponError]   = useState('')
  const [applying,    setApplying]      = useState(false)

  const subtotal    = totalPrice
  const gst         = parseFloat((subtotal * GST_RATE).toFixed(2))
  const platformFee = PLATFORM_FEE

  const baseDelivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
  const deliveryFee  = promo?.freeDelivery ? 0 : baseDelivery
  const discount     = promo?.discount || 0
  const grandTotal   = parseFloat((subtotal + gst + platformFee + deliveryFee - discount).toFixed(2))

  const handleApply = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setApplying(true)
    setCouponError('')
    try {
      const res = await apiClient.post('/offers/validate', {
        code,
        subtotal,
        customerId: user?.userId || null,
      })
      const data = res.data.data
      setPromo(data)
      onPromoChange?.(data)
      setCouponInput('')
    } catch (err) {
      setCouponError(err.response?.data?.error?.message || err.message || 'Invalid code')
      setPromo(null)
      onPromoChange?.(null)
    } finally {
      setApplying(false)
    }
  }

  const handleRemove = () => {
    setPromo(null)
    setCouponError('')
    setCouponInput('')
    onPromoChange?.(null)
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>

      {/* Items */}
      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <div className="flex gap-2 items-start">
              <span className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.quantity}
              </span>
              <span className="text-gray-700">{item.name}</span>
            </div>
            <span className="font-semibold text-gray-800 ml-2">
              ₹{(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      {/* Coupon input */}
      {!promo ? (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Promo Code
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
              placeholder="Enter code (e.g. SAVE10)"
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all uppercase placeholder:normal-case placeholder:text-gray-400"
            />
            <Button
              type="button"
              onClick={handleApply}
              disabled={applying || !couponInput.trim()}
              className="px-4 text-sm rounded-xl bg-primary hover:bg-orange-600 disabled:opacity-50"
            >
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
            </Button>
          </div>
          {couponError && (
            <p className="text-xs text-red-500 mt-1.5">{couponError}</p>
          )}
          <p className="text-[11px] text-gray-400 mt-1.5">
            Try: SAVE10 · FLAT50 · WELCOME · FREESHIP · LOYALTY5
          </p>
        </div>
      ) : (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-green-700 flex items-center gap-1">
              <Tag className="w-3 h-3" /> {promo.code} applied
            </p>
            <p className="text-xs text-green-600">{promo.description}</p>
          </div>
          <button onClick={handleRemove} className="text-gray-400 hover:text-gray-600 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Separator className="my-4" />

      {/* Bill breakdown */}
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST (5%)</span>
          <span>₹{gst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Platform fee</span>
          <span>₹{platformFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery fee</span>
          {deliveryFee === 0 ? (
            <span className="text-green-600 font-semibold">
              {promo?.freeDelivery ? 'FREE (promo) 🎉' : 'FREE 🎉'}
            </span>
          ) : (
            <span>₹{deliveryFee.toFixed(2)}</span>
          )}
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600 font-semibold">
            <span>Discount ({promo?.code})</span>
            <span>−₹{discount.toFixed(2)}</span>
          </div>
        )}
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between font-bold text-gray-800 text-base">
        <span>Total</span>
        <span>₹{grandTotal.toFixed(2)}</span>
      </div>
    </div>
  )
}
