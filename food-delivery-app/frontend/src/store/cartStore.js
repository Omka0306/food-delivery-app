import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      isOpen: false,

      // Returns true if added, false if there's a restaurant conflict.
      // Caller is responsible for showing the conflict dialog.
      addItem: (menuItem) => {
        const state = get()
        const incomingRestaurantId = menuItem.restaurantId || null

        if (
          state.items.length > 0 &&
          state.restaurantId &&
          incomingRestaurantId &&
          state.restaurantId !== incomingRestaurantId
        ) {
          return false // conflict — different restaurant
        }

        set((s) => {
          const existing = s.items.find((i) => i.id === menuItem.id)
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            }
          }
          return {
            items: [...s.items, { ...menuItem, quantity: 1 }],
            restaurantId: incomingRestaurantId || s.restaurantId,
          }
        })
        return true
      },

      // Clear cart and add the new item (used after user confirms restaurant switch)
      clearCartAndAdd: (menuItem) =>
        set(() => ({
          items: [{ ...menuItem, quantity: 1 }],
          restaurantId: menuItem.restaurantId || null,
        })),

      removeItem: (id) =>
        set((state) => {
          const next = state.items.filter((i) => i.id !== id)
          return { items: next, restaurantId: next.length ? state.restaurantId : null }
        }),

      incrementQuantity: (id) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        })),

      decrementQuantity: (id) =>
        set((state) => {
          const item = state.items.find((i) => i.id === id)
          if (item && item.quantity === 1) {
            const next = state.items.filter((i) => i.id !== id)
            return { items: next, restaurantId: next.length ? state.restaurantId : null }
          }
          return {
            items: state.items.map((i) =>
              i.id === id ? { ...i, quantity: i.quantity - 1 } : i
            ),
          }
        }),

      clearCart: () => set({ items: [], restaurantId: null }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      isInCart: (id) => get().items.some((i) => i.id === id),
    }),
    { name: 'quickbite-cart' }
  )
)

export default useCartStore
