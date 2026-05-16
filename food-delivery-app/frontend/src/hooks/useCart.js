import useCartStore from '@/store/cartStore'

export default function useCart() {
  const store = useCartStore()
  const totalItems = store.items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = store.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const isInCart = (id) => store.items.some((i) => i.id === id)
  const getQuantity = (id) => store.items.find((i) => i.id === id)?.quantity ?? 0

  return {
    ...store,
    totalItems,
    totalPrice,
    isInCart,
    getQuantity,
  }
}
