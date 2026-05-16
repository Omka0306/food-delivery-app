import apiClient from './apiClient'
import { useAuthStore } from '../store/authStore'

let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  if (import.meta.env.DEV) {
    console.debug(`[api] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            return apiClient(original)
          })
          .catch((e) => Promise.reject(e))
      }

      original._retry = true
      isRefreshing = true

      try {
        const newToken = await useAuthStore.getState().refreshAccessToken()
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        await useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    const details = err.response?.data?.error?.details
    const message =
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      'An unexpected error occurred'
    const error = new Error(message)
    if (details?.length) error.details = details
    return Promise.reject(error)
  }
)

// ── Menu (public) ──────────────────────────────────────────────────────────
export const menuApi = {
  getAll: (category) =>
    apiClient.get('/menu', { params: category && category !== 'All' ? { category } : {} }),
  getById: (id) => apiClient.get(`/menu/${id}`),
}

// ── Orders ─────────────────────────────────────────────────────────────────
export const ordersApi = {
  place: (orderData) => apiClient.post('/orders', orderData),
  getById: (orderId) => apiClient.get(`/orders/${orderId}`),
  track: (orderId) => apiClient.get(`/orders/${orderId}`),
  updateStatus: (orderId, status) => apiClient.patch(`/orders/${orderId}/status`, { status }),
  getMyOrders: () => apiClient.get('/orders/my'),
}

// ── Restaurants ────────────────────────────────────────────────────────────
export const restaurantApi = {
  getAll: (params) => apiClient.get('/restaurants', { params }),
  getById: (id) => apiClient.get(`/restaurants/${id}`),
  update: (id, data) => apiClient.patch(`/restaurants/${id}`, data),
  updateSettings: (id, data) => apiClient.patch(`/restaurants/${id}`, data),
  getOrders: (id, params) => apiClient.get(`/restaurants/${id}/orders`, { params }),
  updateOrderStatus: (restaurantId, orderId, status) =>
    apiClient.patch(`/restaurants/${restaurantId}/orders/${orderId}/status`, { status }),
  getAnalytics: (id) => apiClient.get(`/restaurants/${id}/analytics`),
  getMenu: (id) => apiClient.get(`/restaurants/${id}/menu`),
  getMenuItems: (id) => apiClient.get(`/restaurants/${id}/menu`),
  toggleMenuAvailability: (restaurantId, itemId, available) =>
    apiClient.patch(`/restaurants/${restaurantId}/menu/${itemId}/availability`, { available }),
}

// ── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  getRestaurants: (params) => apiClient.get('/restaurants', { params }),
  getUsers: () => apiClient.get('/admin/users'),
  getOrders: (params) => apiClient.get('/admin/orders', { params }),
  getAnalytics: () => apiClient.get('/admin/analytics'),
  approveRestaurant: (id) => apiClient.patch(`/admin/restaurants/${id}/approve`),
  suspendRestaurant: (id) => apiClient.patch(`/admin/restaurants/${id}/suspend`),
}

// ── Health ──────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => apiClient.get('/health'),
}

export default apiClient
