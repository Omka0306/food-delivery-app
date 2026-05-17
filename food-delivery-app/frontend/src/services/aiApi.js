import apiClient from './apiClient'
import { useAuthStore } from '../store/authStore'

export const aiApi = {
  recommend: (query, location, mood, filters) =>
    apiClient.post('/ai/recommend', { query, location, mood, filters }),

  quickSuggestions: () =>
    apiClient.get('/ai/suggestions/quick'),

  sendFeedback: (recommendationId, itemId, action) =>
    apiClient.post('/ai/feedback', { recommendationId, itemId, action }),

  getHistory: () =>
    apiClient.get('/ai/history'),

  getProfile: () =>
    apiClient.get('/ai/profile'),

  updateProfile: (profile) =>
    apiClient.put('/ai/profile', profile),

  // Streaming chat — returns a raw fetch Response for SSE reading
  startChat: (message, history) => {
    const token = useAuthStore.getState().accessToken
    const base  = import.meta.env.VITE_API_URL || ''
    return fetch(`${base}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query: message, conversationHistory: history }),
    })
  },
}
