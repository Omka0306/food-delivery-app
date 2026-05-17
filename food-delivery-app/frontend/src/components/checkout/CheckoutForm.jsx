import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ordersApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import useCart from '@/hooks/useCart'
import AddressSelector from './AddressSelector'

const schema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be exactly 10 digits'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  specialInstructions: z.string().optional(),
})

function FieldWrapper({ label, error, success, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-gray-700 font-medium">{label}</Label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertTriangle className="w-3 h-3" /> {error}
        </p>
      )}
      {success && !error && (
        <p className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="w-3 h-3" /> Looks good!
        </p>
      )}
    </div>
  )
}

export default function CheckoutForm() {
  const navigate  = useNavigate()
  const { items, totalPrice, clearCart } = useCart()
  const { user, isAuthenticated } = useAuthStore()

  const [selectedAddr,  setSelectedAddr]  = useState(null)
  const [showManual,    setShowManual]    = useState(false)

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, touchedFields, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const watched = watch()

  // When a saved address is selected, fill the form fields
  useEffect(() => {
    if (selectedAddr) {
      setValue('customerName', selectedAddr.name,        { shouldValidate: true })
      setValue('phone',        selectedAddr.phone,       { shouldValidate: true })
      setValue('address',      selectedAddr.addressLine, { shouldValidate: true })
      setShowManual(false)
    }
  }, [selectedAddr, setValue])

  const handleSelectAddr = (addr) => {
    setSelectedAddr(addr)
  }

  const handleUseManual = () => {
    setSelectedAddr(null)
    setShowManual(true)
    setValue('customerName', '')
    setValue('phone', '')
    setValue('address', '')
  }

  const { mutate, isPending } = useMutation({
    mutationFn: (formData) => {
      const payload = {
        customerName: formData.customerName,
        phone:        formData.phone,
        address:      formData.address,
        ...(user?.userId             && { customerId:   user.userId }),
        ...(items[0]?.restaurantId   && { restaurantId: items[0].restaurantId }),
        items: items.map((i) => ({
          menuItemId: i.id,
          quantity:   i.quantity,
          name:       i.name,
          price:      i.price,
        })),
      }
      return ordersApi.place(payload)
    },
    onSuccess: (res) => {
      clearCart()
      toast.success('🎉 Order placed successfully!')
      navigate(`/order/${res.data.data.orderId}`)
    },
    onError: () => toast.error('Something went wrong. Please try again.'),
  })

  const deliveryFee  = totalPrice >= 499 ? 0 : 40
  const orderTotal   = totalPrice + deliveryFee

  return (
    <form onSubmit={handleSubmit(mutate)} className="space-y-5">

      {/* ── Saved addresses (only for logged-in customers) ─────── */}
      {isAuthenticated && (
        <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Deliver to</h2>

          <AddressSelector selectedId={selectedAddr?.addressId} onSelect={handleSelectAddr} />

          {/* Separator between selector and manual entry toggle */}
          {!showManual && (
            <button
              type="button"
              onClick={handleUseManual}
              className="text-xs text-gray-400 hover:text-primary font-medium flex items-center gap-1 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" /> Enter a different address
            </button>
          )}
          {showManual && (
            <button
              type="button"
              onClick={() => setShowManual(false)}
              className="text-xs text-gray-400 hover:text-primary font-medium flex items-center gap-1 transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5" /> Use a saved address
            </button>
          )}
        </div>
      )}

      {/* ── Delivery details form ──────────────────────────────── */}
      {/* Show when: not logged in, OR using a saved address, OR in manual mode */}
      {(!isAuthenticated || selectedAddr || showManual) && (
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              {selectedAddr ? 'Delivery Details' : 'Enter Delivery Details'}
            </h2>
            {selectedAddr && (
              <span className="text-xs bg-orange-50 text-primary border border-orange-200 rounded-full px-2.5 py-0.5 font-semibold">
                {selectedAddr.label}
              </span>
            )}
          </div>

          <FieldWrapper
            label="Full Name"
            error={errors.customerName?.message}
            success={touchedFields.customerName && !errors.customerName && watched.customerName?.length >= 2}
          >
            <Input
              {...register('customerName')}
              placeholder="John Doe"
              readOnly={!!selectedAddr}
              className={`${errors.customerName ? 'border-red-400' : ''} ${selectedAddr ? 'bg-gray-50 cursor-default' : ''}`}
            />
          </FieldWrapper>

          <FieldWrapper
            label="Phone Number"
            error={errors.phone?.message}
            success={touchedFields.phone && !errors.phone}
          >
            <Input
              {...register('phone')}
              placeholder="9876543210"
              type="tel"
              readOnly={!!selectedAddr}
              className={`${errors.phone ? 'border-red-400' : ''} ${selectedAddr ? 'bg-gray-50 cursor-default' : ''}`}
            />
          </FieldWrapper>

          <FieldWrapper
            label="Delivery Address"
            error={errors.address?.message}
            success={touchedFields.address && !errors.address && watched.address?.length >= 10}
          >
            <textarea
              {...register('address')}
              placeholder="House/Flat no., Street, Area, City, Pincode"
              rows={3}
              readOnly={!!selectedAddr}
              className={`flex w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed resize-none ${
                errors.address ? 'border-red-400' : 'border-input'
              } ${selectedAddr ? 'bg-gray-50 cursor-default' : ''}`}
            />
          </FieldWrapper>

          {/* Change address link when a saved address is pre-filled */}
          {selectedAddr && (
            <button
              type="button"
              onClick={handleUseManual}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Edit address →
            </button>
          )}

          <FieldWrapper label="Special Instructions (optional)">
            <textarea
              {...register('specialInstructions')}
              placeholder="Any allergies or special requests?"
              rows={2}
              className="flex w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 resize-none"
            />
          </FieldWrapper>

          <Button
            type="submit"
            disabled={isPending || items.length === 0}
            className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-orange-400 hover:from-orange-600 hover:to-orange-500 shadow-lg shadow-orange-200"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Placing Order...</>
            ) : (
              `Place Order • ₹${orderTotal.toFixed(2)}`
            )}
          </Button>
        </div>
      )}

      {/* Edge case: logged in, has addresses, nothing selected yet and not in manual mode */}
      {isAuthenticated && !selectedAddr && !showManual && (
        <div className="bg-white rounded-2xl shadow-md p-6">
          <p className="text-sm text-gray-400 text-center">Select a saved address above or enter a new one to continue.</p>
        </div>
      )}
    </form>
  )
}
