import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ordersApi } from '@/services/api'
import { useWebSocket } from './useWebSocket'
import { playOutForDeliverySound } from '@/utils/sounds'

const STATUS_TOASTS = {
  Preparing: '👨‍🍳 Restaurant accepted your order and is preparing it!',
  'Out for Delivery': '🛵 Your order is out for delivery!',
  Delivered: '🎉 Your order has been delivered. Enjoy!',
}

export default function useOrderTracking(orderId) {
  const queryClient = useQueryClient()
  const [wsConnected, setWsConnected] = useState(false)

  const query = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await ordersApi.getById(orderId)
      return res.data.data
    },
    enabled: !!orderId,
    refetchInterval: (q) => {
      if (wsConnected) return false
      return q.state.data?.status === 'Delivered' ? false : 10000
    },
  })

  const handleWsMessage = useCallback(
    (data) => {
      if (data.type === 'ORDER_STATUS_UPDATE' && data.order?.orderId === orderId) {
        queryClient.setQueryData(['order', orderId], data.order)
        const msg = STATUS_TOASTS[data.order.status]
        if (msg) toast.success(msg, { duration: 5000 })
        if (data.order.status === 'Out for Delivery') playOutForDeliverySound()
      }
      if (data.type === 'pong') setWsConnected(true)
    },
    [orderId, queryClient]
  )

  useWebSocket(handleWsMessage)

  useEffect(() => {
    setWsConnected(false)
  }, [orderId])

  return { ...query, wsConnected }
}
