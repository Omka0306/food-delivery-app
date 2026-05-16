import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'

export const useWebSocket = (onMessage) => {
  const wsRef = useRef(null)
  const onMessageRef = useRef(onMessage)
  const reconnectTimerRef = useRef(null)
  const { accessToken, user, isAuthenticated } = useAuthStore()

  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL
    if (!isAuthenticated || !accessToken || !wsUrl) return

    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const url = `${wsUrl}?token=${accessToken}&userId=${user?.userId ?? ''}&role=${user?.role ?? ''}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      ws._pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'ping' }))
        }
      }, 30000)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessageRef.current?.(data)
      } catch (_) {}
    }

    ws.onclose = (event) => {
      clearInterval(ws._pingInterval)
      if (event.code !== 1000) {
        reconnectTimerRef.current = setTimeout(connect, 3000)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [accessToken, user, isAuthenticated])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        clearInterval(wsRef.current._pingInterval)
        wsRef.current.close(1000)
        wsRef.current = null
      }
    }
  }, [connect])

  return { ws: wsRef.current }
}
