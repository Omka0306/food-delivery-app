import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Home, Briefcase, MapPin, Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { addressesApi } from '@/services/api'
import AddressFormModal from './AddressFormModal'

const LABEL_META = {
  Home:  { Icon: Home,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
  Work:  { Icon: Briefcase,  color: 'text-purple-600', bg: 'bg-purple-50' },
  Other: { Icon: MapPin,     color: 'text-green-600',  bg: 'bg-green-50'  },
}

export default function AddressSelector({ selectedId, onSelect }) {
  const queryClient = useQueryClient()
  const [showForm,     setShowForm]     = useState(false)
  const [editingAddr,  setEditingAddr]  = useState(null)

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['saved-addresses'],
    queryFn: async () => {
      const res = await addressesApi.list()
      return res.data.data
    },
    staleTime: 2 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (addressId) => addressesApi.remove(addressId),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] })
      if (selectedId === deletedId) onSelect(null)
      toast.success('Address removed')
    },
    onError: () => toast.error('Could not delete address'),
  })

  const handleDelete = (e, addr) => {
    e.stopPropagation()
    toast(
      (t) => (
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-semibold text-gray-800">Remove this address?</p>
          <div className="flex gap-2">
            <button
              onClick={() => { deleteMutation.mutate(addr.addressId); toast.dismiss(t.id) }}
              className="flex-1 bg-red-500 text-white text-xs font-bold py-1.5 rounded-lg"
            >Remove</button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 bg-gray-100 text-gray-700 text-xs font-bold py-1.5 rounded-lg"
            >Cancel</button>
          </div>
        </div>
      ),
      { duration: 6000 }
    )
  }

  const handleEdit = (e, addr) => {
    e.stopPropagation()
    setEditingAddr(addr)
    setShowForm(true)
  }

  if (isLoading) {
    return <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">Saved Addresses</h3>
          <button
            type="button"
            onClick={() => { setEditingAddr(null); setShowForm(true) }}
            className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add new
          </button>
        </div>

        {addresses.length === 0 ? (
          <button
            type="button"
            onClick={() => { setEditingAddr(null); setShowForm(true) }}
            className="w-full flex items-center gap-3 border-2 border-dashed border-gray-200 hover:border-primary/40 rounded-2xl p-4 text-gray-400 hover:text-primary transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-orange-50 flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Add delivery address</p>
              <p className="text-xs">Save addresses for faster checkout</p>
            </div>
          </button>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {addresses.map((addr) => {
              const meta = LABEL_META[addr.label] || LABEL_META.Other
              const { Icon } = meta
              const isSelected = selectedId === addr.addressId

              return (
                <motion.button
                  key={addr.addressId}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelect(addr)}
                  className={`relative flex-shrink-0 w-52 text-left rounded-2xl border-2 p-3.5 transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-orange-50 shadow-md shadow-orange-100'
                      : 'border-gray-200 bg-white hover:border-orange-300'
                  }`}
                >
                  {/* Selected check */}
                  {isSelected && (
                    <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-primary fill-primary/10" />
                  )}

                  {/* Label icon + badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-full ${meta.bg} flex items-center justify-center`}>
                      <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                    </div>
                    <span className={`text-xs font-bold ${meta.color}`}>{addr.label}</span>
                    {addr.isDefault && (
                      <span className="ml-auto text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Default</span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-gray-800 truncate">{addr.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{addr.addressLine}</p>

                  {/* Edit / Delete */}
                  <div className="flex gap-1 mt-2.5">
                    <button
                      type="button"
                      onClick={(e) => handleEdit(e, addr)}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-primary font-medium transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <span className="text-gray-200 mx-1">|</span>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, addr)}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 font-medium transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </motion.button>
              )
            })}

            {/* Add new card */}
            <button
              type="button"
              onClick={() => { setEditingAddr(null); setShowForm(true) }}
              className="flex-shrink-0 w-44 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-primary/40 rounded-2xl p-4 text-gray-400 hover:text-primary transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs font-semibold">Add address</span>
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <AddressFormModal
          existing={editingAddr}
          onClose={() => { setShowForm(false); setEditingAddr(null) }}
          onSaved={(addr) => { if (!editingAddr) onSelect(addr) }}
        />
      )}
    </>
  )
}
