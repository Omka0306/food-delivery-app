import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UtensilsCrossed, ToggleLeft, ToggleRight, Loader2,
  Plus, Pencil, Trash2, X, Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { restaurantApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

const CATEGORIES = ['Pizza', 'Burgers', 'Sides', 'Drinks']

const CATEGORY_COLORS = {
  Burgers: 'bg-orange-50', Pizza: 'bg-red-50', Sides: 'bg-green-50',
  Drinks: 'bg-blue-50', default: 'bg-gray-50',
}
const CATEGORY_EMOJI = {
  Burgers: '🍔', Pizza: '🍕', Sides: '🍟', Drinks: '🥤', default: '🍽️',
}

const EMPTY_FORM = {
  name: '', description: '', price: '', category: 'Burgers',
  imageUrl: '', isVeg: true, prepTime: '15-20 mins',
}

function ItemFormModal({ initial, onClose, onSave, isSaving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const isEdit = !!initial?.id

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price || !form.category) {
      toast.error('Name, price, and category are required')
      return
    }
    onSave({ ...form, price: parseFloat(form.price) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{isEdit ? 'Edit Item' : 'Add New Item'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Item Name *</label>
            <input
              value={form.name} onChange={set('name')} required
              placeholder="e.g. Margherita Pizza"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
            <textarea
              value={form.description} onChange={set('description')} rows={2}
              placeholder="Brief description of the item"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Price + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Price (₹) *</label>
              <input
                type="number" min="1" step="1" value={form.price} onChange={set('price')} required
                placeholder="299"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Category *</label>
              <select
                value={form.category}
                onChange={set('category')}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Prep Time + Veg row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Prep Time</label>
              <input
                value={form.prepTime} onChange={set('prepTime')}
                placeholder="15-20 mins"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Type</label>
              <div className="flex gap-2 mt-1">
                {[{ v: true, label: 'Veg', color: 'green' }, { v: false, label: 'Non-Veg', color: 'red' }].map(({ v, label, color }) => (
                  <button
                    key={label} type="button"
                    onClick={() => setForm((f) => ({ ...f, isVeg: v }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      form.isVeg === v
                        ? color === 'green'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Image URL (optional)</label>
            <input
              value={form.imageUrl} onChange={set('imageUrl')}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isEdit ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RestaurantMenuPage() {
  const { user } = useAuthStore()
  const restaurantId = user?.restaurantId
  const queryClient = useQueryClient()
  const [togglingId, setTogglingId] = useState(null)
  const [showForm, setShowForm]     = useState(false)
  const [editItem, setEditItem]     = useState(null)

  const QK = ['restaurant-menu', restaurantId]

  const { data: items = [], isLoading } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const res = await restaurantApi.getMenuItems(restaurantId)
      return res.data.data
    },
    enabled: !!restaurantId,
  })

  // Toggle availability
  const toggleMutation = useMutation({
    mutationFn: ({ itemId, available }) =>
      restaurantApi.toggleMenuAvailability(restaurantId, itemId, available),
    onMutate: async ({ itemId, available }) => {
      setTogglingId(itemId)
      await queryClient.cancelQueries({ queryKey: QK })
      const previous = queryClient.getQueryData(QK)
      queryClient.setQueryData(QK, (old) =>
        (old || []).map((i) => (i.id === itemId ? { ...i, available } : i))
      )
      return { previous }
    },
    onSuccess: (_, { available }) =>
      toast.success(available ? 'Marked as available' : 'Marked as unavailable'),
    onError: (err, _, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(QK, ctx.previous)
      toast.error(err.message || 'Failed to update')
    },
    onSettled: () => {
      setTogglingId(null)
      queryClient.invalidateQueries({ queryKey: QK })
    },
  })

  // Add item
  const addMutation = useMutation({
    mutationFn: (data) => restaurantApi.createMenuItem(restaurantId, data),
    onSuccess: () => {
      toast.success('Item added!')
      setShowForm(false)
      queryClient.invalidateQueries({ queryKey: QK })
    },
    onError: (err) => toast.error(err.message || 'Failed to add item'),
  })

  // Edit item
  const editMutation = useMutation({
    mutationFn: ({ itemId, data }) => restaurantApi.updateMenuItem(restaurantId, itemId, data),
    onSuccess: () => {
      toast.success('Item updated!')
      setEditItem(null)
      queryClient.invalidateQueries({ queryKey: QK })
    },
    onError: (err) => toast.error(err.message || 'Failed to update item'),
  })

  // Delete item
  const deleteMutation = useMutation({
    mutationFn: (itemId) => restaurantApi.deleteMenuItem(restaurantId, itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: QK })
      const previous = queryClient.getQueryData(QK)
      queryClient.setQueryData(QK, (old) => (old || []).filter((i) => i.id !== itemId))
      return { previous }
    },
    onSuccess: () => toast.success('Item deleted'),
    onError: (err, _, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(QK, ctx.previous)
      toast.error(err.message || 'Failed to delete')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QK }),
  })

  const toggleAvailability = (item) => {
    if (togglingId) return
    toggleMutation.mutate({ itemId: item.id, available: item.available !== false ? false : true })
  }

  const confirmDelete = (item) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-semibold text-gray-800">Delete "{item.name}"?</p>
          <p className="text-gray-500 text-xs">This cannot be undone.</p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => { deleteMutation.mutate(item.id); toast.dismiss(t.id) }}
              className="flex-1 bg-red-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 bg-gray-100 text-gray-700 text-xs font-bold py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 8000, style: { maxWidth: 320 } }
    )
  }

  const categories = [...new Set(items.map((i) => i.category || 'Other'))]

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading menu…
      </div>
    )
  }

  return (
    <>
      {(showForm || editItem) && (
        <ItemFormModal
          initial={editItem}
          onClose={() => { setShowForm(false); setEditItem(null) }}
          onSave={(data) => {
            if (editItem) {
              editMutation.mutate({ itemId: editItem.id, data })
            } else {
              addMutation.mutate(data)
            }
          }}
          isSaving={addMutation.isPending || editMutation.isPending}
        />
      )}

      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Menu Management</h1>
            <p className="text-sm text-gray-400 mt-0.5">{items.length} items</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
            <UtensilsCrossed className="w-12 h-12 text-gray-200" />
            <p>No menu items yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-primary text-sm font-semibold hover:underline"
            >
              + Add your first item
            </button>
          </div>
        ) : (
          categories.map((cat) => {
            const catItems = items.filter((i) => (i.category || 'Other') === cat)
            const bg    = CATEGORY_COLORS[cat] || CATEGORY_COLORS.default
            const emoji = CATEGORY_EMOJI[cat]  || CATEGORY_EMOJI.default

            return (
              <div key={cat}>
                <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>{emoji}</span> {cat}
                  <span className="text-xs text-gray-400 font-normal">({catItems.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catItems.map((item) => {
                    const available  = item.available !== false
                    const isToggling = togglingId === item.id

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border overflow-hidden shadow-sm transition-opacity ${
                          available ? 'border-gray-100 opacity-100' : 'border-gray-200 opacity-60'
                        }`}
                      >
                        <div className={`h-32 flex items-center justify-center text-5xl ${bg} relative`}>
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl} alt={item.name}
                              className="h-full w-full object-cover"
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          ) : emoji}
                          {/* Veg/Non-veg dot */}
                          <div className="absolute bottom-2 left-2">
                            <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center bg-white ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                              <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                              <p className="text-orange-600 font-bold mt-2">₹{item.price}</p>
                            </div>
                            {/* Availability toggle */}
                            <button
                              onClick={() => toggleAvailability(item)}
                              disabled={isToggling}
                              className={`flex-shrink-0 mt-0.5 transition-colors ${
                                isToggling ? 'text-gray-300 cursor-wait'
                                  : available ? 'text-green-500 hover:text-green-600'
                                  : 'text-gray-300 hover:text-gray-400'
                              }`}
                              title={available ? 'Mark unavailable' : 'Mark available'}
                            >
                              {isToggling ? <Loader2 className="w-8 h-8 animate-spin" />
                                : available ? <ToggleRight className="w-8 h-8" />
                                : <ToggleLeft className="w-8 h-8" />}
                            </button>
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                              available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                            }`}>
                              {available ? 'Available' : 'Unavailable'}
                            </span>
                            <div className="ml-auto flex gap-1">
                              <button
                                onClick={() => setEditItem(item)}
                                className="p-1.5 text-gray-400 hover:text-primary hover:bg-orange-50 rounded-lg transition-colors"
                                title="Edit item"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => confirmDelete(item)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
