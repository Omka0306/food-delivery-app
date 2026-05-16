import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ordersApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import useCart from '@/hooks/useCart'

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
  const navigate = useNavigate()
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuthStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const watched = watch()

  const { mutate, isPending } = useMutation({
    mutationFn: (formData) => {
      const payload = {
        customerName: formData.customerName,
        phone: formData.phone,
        address: formData.address,
        ...(user?.userId && { customerId: user.userId }),
        ...(items[0]?.restaurantId && { restaurantId: items[0].restaurantId }),
        items: items.map((i) => ({
          menuItemId: i.id,
          quantity: i.quantity,
          name: i.name,
          price: i.price,
        })),
      }
      return ordersApi.place(payload)
    },
    onSuccess: (res) => {
      clearCart()
      toast.success('🎉 Order placed successfully!')
      navigate(`/order/${res.data.data.orderId}`)
    },
    onError: () => {
      toast.error('Something went wrong. Please try again.')
    },
  })

  return (
    <form onSubmit={handleSubmit(mutate)} className="bg-white rounded-2xl shadow-md p-6 space-y-5">
      <h2 className="text-lg font-bold text-gray-800 mb-2">Delivery Details</h2>

      <FieldWrapper
        label="Full Name"
        error={errors.customerName?.message}
        success={touchedFields.customerName && !errors.customerName && watched.customerName?.length >= 2}
      >
        <Input
          {...register('customerName')}
          placeholder="John Doe"
          className={errors.customerName ? 'border-red-400 focus-visible:ring-red-400' : ''}
          data-testid="field-name"
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
          className={errors.phone ? 'border-red-400 focus-visible:ring-red-400' : ''}
          data-testid="field-phone"
        />
      </FieldWrapper>

      <FieldWrapper
        label="Delivery Address"
        error={errors.address?.message}
        success={touchedFields.address && !errors.address && watched.address?.length >= 10}
      >
        <textarea
          {...register('address')}
          placeholder="123 Main Street, City, State 400001"
          rows={3}
          className={`flex w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
            errors.address ? 'border-red-400' : 'border-input'
          }`}
          data-testid="field-address"
        />
      </FieldWrapper>

      <FieldWrapper label="Special Instructions (optional)">
        <textarea
          {...register('specialInstructions')}
          placeholder="Any allergies or special requests?"
          rows={2}
          className="flex w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 resize-none"
          data-testid="field-instructions"
        />
      </FieldWrapper>

      <Button
        type="submit"
        disabled={isPending || items.length === 0}
        className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-orange-400 hover:from-orange-600 hover:to-orange-500 shadow-lg shadow-orange-200"
        data-testid="submit-btn"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Placing Order...
          </>
        ) : (
          `Place Order • $${(totalPrice + (totalPrice >= 20 ? 0 : 2.99)).toFixed(2)}`
        )}
      </Button>
    </form>
  )
}
