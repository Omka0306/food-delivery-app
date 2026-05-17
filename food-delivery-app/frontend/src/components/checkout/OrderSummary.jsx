import { Separator } from '@/components/ui/separator'
import useCart from '@/hooks/useCart'

const DELIVERY_FEE = 40
const FREE_DELIVERY_THRESHOLD = 499

export default function OrderSummary() {
  const { items, totalPrice } = useCart()
  const deliveryFee = totalPrice >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
  const grandTotal = totalPrice + deliveryFee

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>

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

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery fee</span>
          {deliveryFee === 0 ? (
            <span className="text-green-600 font-semibold">FREE 🎉</span>
          ) : (
            <span>₹{deliveryFee.toFixed(2)}</span>
          )}
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between font-bold text-gray-800 text-base">
        <span>Total</span>
        <span>₹{grandTotal.toFixed(2)}</span>
      </div>
    </div>
  )
}
