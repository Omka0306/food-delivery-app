import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Home, Briefcase, MapPin, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { addressesApi } from '@/services/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const LABELS = [
  { key: 'Home',  Icon: Home,      color: 'text-blue-600',  bg: 'bg-blue-50  border-blue-200'  },
  { key: 'Work',  Icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  { key: 'Other', Icon: MapPin,    color: 'text-green-600', bg: 'bg-green-50 border-green-200'  },
]

export default function AddressFormModal({ existing, onClose, onSaved }) {
  const queryClient = useQueryClient()
  const isEdit = !!existing

  const [label,       setLabel]       = useState(existing?.label       || 'Home')
  const [name,        setName]        = useState(existing?.name        || '')
  const [phone,       setPhone]       = useState(existing?.phone       || '')
  const [addressLine, setAddressLine] = useState(existing?.addressLine || '')
  const [isDefault,   setIsDefault]   = useState(existing?.isDefault   ?? false)

  const mutation = useMutation({
    mutationFn: () => {
      const data = { label, name, phone, addressLine, isDefault }
      return isEdit
        ? addressesApi.update(existing.addressId, data)
        : addressesApi.add(data)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] })
      toast.success(isEdit ? 'Address updated' : 'Address saved!')
      onSaved?.(res.data.data)
      onClose()
    },
    onError: (err) => toast.error(err.message || 'Could not save address'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Enter your name'); return }
    if (!/^[0-9]{10}$/.test(phone)) { toast.error('Enter a valid 10-digit phone number'); return }
    if (addressLine.trim().length < 10) { toast.error('Enter a complete address'); return }
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-base">{isEdit ? 'Edit Address' : 'Add New Address'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {/* Label picker */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium text-sm">Save as</Label>
            <div className="flex gap-2">
              {LABELS.map(({ key, Icon, color, bg }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLabel(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    label === key ? `${bg} ${color}` : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {key}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-gray-700 font-medium text-sm">Contact Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="text-sm"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-gray-700 font-medium text-sm">Phone Number</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              type="tel"
              className="text-sm"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label className="text-gray-700 font-medium text-sm">Delivery Address</Label>
            <textarea
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="House/Flat no., Street, Area, City, Pincode"
              rows={3}
              className="flex w-full rounded-md border border-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 resize-none"
            />
          </div>

          {/* Default checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded accent-orange-500"
            />
            <span className="text-sm text-gray-600 font-medium">Set as default address</span>
          </label>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm mt-1"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {mutation.isPending ? 'Saving…' : isEdit ? 'Update Address' : 'Save Address'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
