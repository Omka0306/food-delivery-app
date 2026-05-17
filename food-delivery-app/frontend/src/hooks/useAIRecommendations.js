import { useState, useCallback } from 'react'
import { aiApi } from '../services/aiApi'

export function useAIRecommendations() {
  const [recommendations, setRecommendations] = useState([])
  const [greeting,        setGreeting]        = useState('')
  const [tip,             setTip]             = useState(null)
  const [context,         setContext]         = useState(null)
  const [isLoading,       setIsLoading]       = useState(false)
  const [error,           setError]           = useState(null)
  const [hasSearched,     setHasSearched]     = useState(false)

  const search = useCallback(async (query, options = {}) => {
    if (!query?.trim()) return
    setIsLoading(true)
    setError(null)

    // Try geolocation; fall back to Mumbai
    let location = { lat: 19.076, lon: 72.877 }
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
      )
      location = { lat: pos.coords.latitude, lon: pos.coords.longitude }
    } catch {
      // use default
    }

    try {
      const res  = await aiApi.recommend(query.trim(), location, options.mood, options.filters)
      const data = res.data?.data || {}
      setRecommendations(data.recommendations || [])
      setGreeting(data.greeting || '')
      setTip(data.tip || null)
      setContext(data.context || null)
      setHasSearched(true)

      // Mark AI as used (removes "NEW" badge)
      localStorage.setItem('ai-assistant-used', '1')
    } catch (err) {
      if (err.response?.status === 429) {
        const resetMs = err.response.headers?.['x-ratelimit-reset']
          ? parseInt(err.response.headers['x-ratelimit-reset']) * 1000 - Date.now()
          : 60 * 60 * 1000
        setError({ type: 'rate_limit', resetMs, message: err.response?.data?.error?.message })
      } else {
        setError({ type: 'general', message: 'Could not get recommendations. Try again!' })
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setRecommendations([])
    setGreeting('')
    setTip(null)
    setError(null)
    setHasSearched(false)
  }, [])

  return { recommendations, greeting, tip, context, isLoading, error, hasSearched, search, clear }
}
