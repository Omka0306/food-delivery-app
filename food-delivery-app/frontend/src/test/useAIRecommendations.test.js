import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAIRecommendations } from '@/hooks/useAIRecommendations'
import { aiApi } from '@/services/aiApi'

vi.mock('@/services/aiApi', () => ({
  aiApi: {
    recommend: vi.fn(),
  },
}))

// Stub geolocation to always error (use Mumbai fallback)
beforeEach(() => {
  Object.defineProperty(global.navigator, 'geolocation', {
    value:      { getCurrentPosition: vi.fn((_s, err) => err(new Error('denied'))) },
    configurable: true,
  })
  localStorage.clear()
})

afterEach(() => vi.clearAllMocks())

const sampleResponse = {
  data: {
    data: {
      recommendations: [
        { menuItemId: 'item-1', name: 'Masala Dosa', price: 120, restaurantId: 'rest-1' },
      ],
      greeting: 'Here is a great pick!',
      tip:      'Try with coconut chutney',
      context:  { time: { meal: 'Breakfast' } },
    },
  },
}

describe('useAIRecommendations', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => useAIRecommendations())
    expect(result.current.recommendations).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasSearched).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets isLoading true during request and false after', async () => {
    aiApi.recommend.mockResolvedValueOnce(sampleResponse)
    const { result } = renderHook(() => useAIRecommendations())

    act(() => { result.current.search('dosa') })
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  it('populates recommendations on success', async () => {
    aiApi.recommend.mockResolvedValueOnce(sampleResponse)
    const { result } = renderHook(() => useAIRecommendations())

    await act(async () => { await result.current.search('dosa') })

    expect(result.current.recommendations).toHaveLength(1)
    expect(result.current.recommendations[0].name).toBe('Masala Dosa')
    expect(result.current.greeting).toBe('Here is a great pick!')
    expect(result.current.tip).toBe('Try with coconut chutney')
    expect(result.current.hasSearched).toBe(true)
  })

  it('sets rate_limit error on 429', async () => {
    const err = new Error('rate limit')
    err.response = {
      status: 429,
      headers: {},
      data: { error: { message: 'Too many requests' } },
    }
    aiApi.recommend.mockRejectedValueOnce(err)
    const { result } = renderHook(() => useAIRecommendations())

    await act(async () => { await result.current.search('pizza') })

    expect(result.current.error?.type).toBe('rate_limit')
    expect(result.current.recommendations).toEqual([])
  })

  it('sets general error on non-429 failure', async () => {
    aiApi.recommend.mockRejectedValueOnce(new Error('Network Error'))
    const { result } = renderHook(() => useAIRecommendations())

    await act(async () => { await result.current.search('burger') })

    expect(result.current.error?.type).toBe('general')
  })

  it('does nothing when query is empty', async () => {
    const { result } = renderHook(() => useAIRecommendations())
    await act(async () => { await result.current.search('   ') })
    expect(aiApi.recommend).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })

  it('clears state on clear()', async () => {
    aiApi.recommend.mockResolvedValueOnce(sampleResponse)
    const { result } = renderHook(() => useAIRecommendations())
    await act(async () => { await result.current.search('dosa') })

    act(() => { result.current.clear() })

    expect(result.current.recommendations).toEqual([])
    expect(result.current.hasSearched).toBe(false)
    expect(result.current.greeting).toBe('')
  })

  it('sets ai-assistant-used in localStorage on success', async () => {
    aiApi.recommend.mockResolvedValueOnce(sampleResponse)
    const { result } = renderHook(() => useAIRecommendations())
    await act(async () => { await result.current.search('dosa') })
    expect(localStorage.getItem('ai-assistant-used')).toBe('1')
  })

  it('calls aiApi.recommend with Mumbai fallback when geolocation denied', async () => {
    aiApi.recommend.mockResolvedValueOnce(sampleResponse)
    const { result } = renderHook(() => useAIRecommendations())
    await act(async () => { await result.current.search('dosa') })
    expect(aiApi.recommend).toHaveBeenCalledWith(
      'dosa',
      { lat: 19.076, lon: 72.877 },
      undefined,
      undefined
    )
  })
})
