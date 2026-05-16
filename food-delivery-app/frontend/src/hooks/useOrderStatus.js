import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/services/api'

export default function useOrderStatus(orderId) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await ordersApi.getById(orderId)
      return res.data.data
    },
    enabled: !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'Delivered' ? false : 5000
    },
  })
}
