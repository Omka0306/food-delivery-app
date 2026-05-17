import { useState, useEffect, useCallback, useRef } from 'react'
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
  const prevStatusRef = useRef(null)

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

  // Fires on EVERY status change — covers both WebSocket push and HTTP polling paths
  useEffect(() => {
    const currentStatus = query.data?.status
    if (!currentStatus) return

    const prevStatus = prevStatusRef.current
    prevStatusRef.current = currentStatus

    // Skip the initial population (no previous status to compare against)
    if (!prevStatus || prevStatus === currentStatus) return

    const msg = STATUS_TOASTS[currentStatus]
    if (msg) toast.success(msg, { duration: 6000 })
    if (currentStatus === 'Out for Delivery') playOutForDeliverySound()
  }, [query.data?.status])

  // WebSocket: update query cache so the useEffect above fires, then set wsConnected on pong
  const handleWsMessage = useCallback(
    (data) => {
      if (data.type === 'ORDER_STATUS_UPDATE' && data.order?.orderId === orderId) {
        queryClient.setQueryData(['order', orderId], data.order)
      }
      if (data.type === 'pong') setWsConnected(true)
    },
    [orderId, queryClient]
  )

  useWebSocket(handleWsMessage)

  useEffect(() => {
    prevStatusRef.current = null
    setWsConnected(false)
  }, [orderId])

  return { ...query, wsConnected }
}
