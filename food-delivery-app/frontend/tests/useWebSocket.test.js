import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWebSocket } from '../src/hooks/useWebSocket'

vi.mock('../src/store/authStore', () => ({
  useAuthStore: () => ({
    accessToken: 'test-token',
    user: { userId: 'user-1', role: 'customer' },
    isAuthenticated: true,
  }),
}))

class MockWebSocket {
  static OPEN = 1
  static CLOSED = 3

  constructor(url) {
    this.url = url
    this.readyState = MockWebSocket.OPEN
    this._pingInterval = null
    MockWebSocket.lastInstance = this
    MockWebSocket.instances.push(this)
    setTimeout(() => this.onopen?.(), 0)
  }

  send = vi.fn()
  close = vi.fn((code) => {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.({ code: code ?? 1000 })
  })

  static lastInstance = null
  static instances = []
  static reset() {
    MockWebSocket.lastInstance = null
    MockWebSocket.instances = []
  }
}

beforeEach(() => {
  MockWebSocket.reset()
  vi.stubGlobal('WebSocket', MockWebSocket)
  vi.stubEnv('VITE_WEBSOCKET_URL', 'wss://test.example.com/prod')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('useWebSocket', () => {
  it('constructs WebSocket with token in URL', async () => {
    renderHook(() => useWebSocket(vi.fn()))
    await act(async () => {})
    expect(MockWebSocket.lastInstance).not.toBeNull()
    expect(MockWebSocket.lastInstance.url).toContain('token=test-token')
    expect(MockWebSocket.lastInstance.url).toContain('userId=user-1')
    expect(MockWebSocket.lastInstance.url).toContain('role=customer')
  })

  it('calls onMessage when a message is received', async () => {
    const onMessage = vi.fn()
    renderHook(() => useWebSocket(onMessage))
    await act(async () => {})

    const ws = MockWebSocket.lastInstance
    const payload = { type: 'ORDER_STATUS_UPDATE', order: { orderId: 'ord-1', status: 'Preparing' } }
    ws.onmessage({ data: JSON.stringify(payload) })

    expect(onMessage).toHaveBeenCalledWith(payload)
  })

  it('ignores malformed JSON messages without throwing', async () => {
    const onMessage = vi.fn()
    renderHook(() => useWebSocket(onMessage))
    await act(async () => {})

    const ws = MockWebSocket.lastInstance
    expect(() => ws.onmessage({ data: 'not valid json' })).not.toThrow()
    expect(onMessage).not.toHaveBeenCalled()
  })

  it('closes WebSocket with code 1000 on unmount', async () => {
    const { unmount } = renderHook(() => useWebSocket(vi.fn()))
    await act(async () => {})

    const ws = MockWebSocket.lastInstance
    unmount()
    expect(ws.close).toHaveBeenCalledWith(1000)
  })

  it('schedules reconnect on non-clean close', async () => {
    const { result } = renderHook(() => useWebSocket(vi.fn()))
    await act(async () => {})

    vi.useFakeTimers()
    const ws = MockWebSocket.lastInstance
    act(() => { ws.close(1006) })

    const instancesBefore = MockWebSocket.instances.length
    act(() => { vi.advanceTimersByTime(3100) })
    expect(MockWebSocket.instances.length).toBeGreaterThan(instancesBefore)

    vi.useRealTimers()
  })
})
