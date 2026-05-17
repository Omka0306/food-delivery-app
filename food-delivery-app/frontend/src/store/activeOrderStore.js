import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useActiveOrderStore = create(
  persist(
    (set) => ({
      orderId: null,
      setActiveOrder: (orderId) => set({ orderId }),
      clearActiveOrder: () => set({ orderId: null }),
    }),
    { name: 'quickbite-active-order' }
  )
)

export default useActiveOrderStore
