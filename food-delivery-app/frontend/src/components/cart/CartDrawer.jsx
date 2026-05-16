import { AnimatePresence } from 'framer-motion'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import CartItem from './CartItem'
import useCart from '@/hooks/useCart'

const DELIVERY_FEE = 2.99
const FREE_DELIVERY_THRESHOLD = 20

export default function CartDrawer() {
  const { items, isOpen, closeCart, totalItems, totalPrice } = useCart()
  const navigate = useNavigate()
  const deliveryFee = totalPrice >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
  const grandTotal = totalPrice + deliveryFee

  const handleCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="flex flex-col p-0 w-full sm:max-w-[420px]">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Your Cart
            {totalItems > 0 && (
              <span className="ml-1 text-sm font-normal text-gray-400">({totalItems} items)</span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6">
            <span className="text-7xl">🛒</span>
            <h3 className="text-lg font-semibold text-gray-700">Your cart is empty</h3>
            <p className="text-sm text-gray-400 text-center">Add some delicious items from our menu</p>
            <Button onClick={closeCart} className="mt-2 rounded-full px-8">
              Browse Menu
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-2">
              <AnimatePresence>
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery fee</span>
                  {deliveryFee === 0 ? (
                    <span className="text-green-600 font-semibold">FREE 🎉</span>
                  ) : (
                    <span>${deliveryFee.toFixed(2)}</span>
                  )}
                </div>
                {deliveryFee > 0 && (
                  <p className="text-xs text-gray-400">
                    Add ${(FREE_DELIVERY_THRESHOLD - totalPrice).toFixed(2)} more for free delivery
                  </p>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-gray-800 text-base">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-orange-400 hover:from-orange-600 hover:to-orange-500 shadow-lg shadow-orange-200"
              >
                Proceed to Checkout <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
