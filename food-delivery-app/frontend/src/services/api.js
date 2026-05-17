import apiClient from './apiClient'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

let isRefreshing     = false
let failedQueue      = []
let sessionExpired   = false   // fires once; suppresses further error propagation

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

function handleSessionExpired() {
  if (sessionExpired) return
  sessionExpired = true

  // Clear persisted auth state (synchronous path; no need to await)
  try { useAuthStore.getState().logout() } catch (_) {}

  toast.error('Your session has expired. Please log in again.', {
    id:       'session-expired',
    duration: 3000,
  })

  // Give the toast a moment to render before the hard redirect
  setTimeout(() => {
    sessionExpired = false          // reset so a fresh login on the same tab works
    window.location.href = '/login'
  }, 1200)
}

// ── Request: attach access token ───────────────────────────────────────────
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

// ── Response: unified error handler ───────────────────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    // While session-expiry redirect is in flight, swallow everything silently
    if (sessionExpired) return new Promise(() => {})

    const original = err.config
    const status   = err.response?.status
    const url      = original?.url || ''

    // ── 401 handling ──────────────────────────────────────────────────────
    if (status === 401) {
      // Never try to refresh for auth endpoints — a 401 there means bad credentials
      const isAuthEndpoint = url.includes('/auth/')
      if (isAuthEndpoint) {
        return Promise.reject(buildError(err))
      }

      // ── First 401: attempt token refresh ────────────────────────────────
      if (!original._retry) {
        if (isRefreshing) {
          // Park this request until the refresh resolves
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then((token) => {
              original.headers.Authorization = `Bearer ${token}`
              return apiClient(original)
            })
            .catch(() => new Promise(() => {}))   // swallow if refresh failed
        }

        original._retry = true
        isRefreshing    = true

        try {
          const newToken = await useAuthStore.getState().refreshAccessToken()
          processQueue(null, newToken)
          original.headers.Authorization = `Bearer ${newToken}`
          isRefreshing = false
          return apiClient(original)              // retry with fresh token
        } catch (_) {
          processQueue(new Error('Session expired'), null)
          handleSessionExpired()
          isRefreshing = false
          return new Promise(() => {})            // swallow — redirect in progress
        }
      }

      // ── Retried request still 401 (token revoked / pool mismatch) ───────
      handleSessionExpired()
      return new Promise(() => {})
    }

    // ── All other errors: surface them normally ───────────────────────────
    return Promise.reject(buildError(err))
  }
)

function buildError(err) {
  const details = err.response?.data?.error?.details
  const message =
    err.response?.data?.error?.message ||
    err.response?.data?.message        ||
    err.message                        ||
    'An unexpected error occurred'
  const error = new Error(message)
  if (details?.length) error.details = details
  return error
}

// ── Menu (public) ──────────────────────────────────────────────────────────
export const menuApi = {
  getAll: (category) =>
    apiClient.get('/menu', { params: category && category !== 'All' ? { category } : {} }),
  getById: (id) => apiClient.get(`/menu/${id}`),
}

// ── Orders ─────────────────────────────────────────────────────────────────
export const ordersApi = {
  place:        (orderData)       => apiClient.post('/orders', orderData),
  getById:      (orderId)         => apiClient.get(`/orders/${orderId}`),
  track:        (orderId)         => apiClient.get(`/orders/${orderId}`),
  updateStatus: (orderId, status) => apiClient.patch(`/orders/${orderId}/status`, { status }),
  getMyOrders:  ()                => apiClient.get('/orders/my'),
}

// ── Restaurants ────────────────────────────────────────────────────────────
export const restaurantApi = {
  getAll:          (params)                         => apiClient.get('/restaurants', { params }),
  getById:         (id)                             => apiClient.get(`/restaurants/${id}`),
  update:          (id, data)                       => apiClient.patch(`/restaurants/${id}`, data),
  updateSettings:  (id, data)                       => apiClient.patch(`/restaurants/${id}`, data),
  getOrders:       (id, params)                     => apiClient.get(`/restaurants/${id}/orders`, { params }),
  updateOrderStatus: (restaurantId, orderId, status) =>
    apiClient.patch(`/restaurants/${restaurantId}/orders/${orderId}/status`, { status }),
  getAnalytics:   (id)                              => apiClient.get(`/restaurants/${id}/analytics`),
  getMenuItems:   (id)                              => apiClient.get(`/restaurants/${id}/menu`),
  getMenu:        (id)                              => apiClient.get(`/restaurants/${id}/menu`),
  toggleMenuAvailability: (restaurantId, itemId, available) =>
    apiClient.patch(`/restaurants/${restaurantId}/menu/${itemId}/availability`, { available }),
  createMenuItem: (restaurantId, data) =>
    apiClient.post(`/restaurants/${restaurantId}/menu`, data),
  updateMenuItem: (restaurantId, itemId, data) =>
    apiClient.patch(`/restaurants/${restaurantId}/menu/${itemId}`, data),
  deleteMenuItem: (restaurantId, itemId) =>
    apiClient.delete(`/restaurants/${restaurantId}/menu/${itemId}`),
}

// ── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  getRestaurants:    (params) => apiClient.get('/restaurants', { params }),
  getUsers:          ()       => apiClient.get('/admin/users'),
  getOrders:         (params) => apiClient.get('/admin/orders', { params }),
  getAnalytics:      ()       => apiClient.get('/admin/analytics'),
  approveRestaurant: (id)     => apiClient.patch(`/admin/restaurants/${id}/approve`),
  suspendRestaurant: (id)     => apiClient.patch(`/admin/restaurants/${id}/suspend`),
}

// ── Saved Addresses ─────────────────────────────────────────────────────────
export const addressesApi = {
  list:   ()                          => apiClient.get('/addresses'),
  add:    (data)                      => apiClient.post('/addresses', data),
  update: (addressId, data)           => apiClient.patch(`/addresses/${addressId}`, data),
  remove: (addressId)                 => apiClient.delete(`/addresses/${addressId}`),
}

// ── Reviews ─────────────────────────────────────────────────────────────────
export const reviewsApi = {
  create:           (data)           => apiClient.post('/reviews', data),
  getByMenuItem:    (itemId)         => apiClient.get(`/reviews/menu/${itemId}`),
  getByRestaurant:  (restaurantId)   => apiClient.get(`/reviews/restaurant/${restaurantId}`),
  getByOrder:       (orderId)        => apiClient.get(`/reviews/order/${orderId}`),
}

// ── AI Meal Assistant ────────────────────────────────────────────────────────
export const aiApi = {
  recommend:      (query, city, filters) => apiClient.post('/ai/recommend', { query, city, filters }),
  quickSuggestions: ()                   => apiClient.get('/ai/suggestions/quick'),
  feedback:       (data)                 => apiClient.post('/ai/feedback', data),
  history:        ()                     => apiClient.get('/ai/history'),
  getProfile:     ()                     => apiClient.get('/ai/profile'),
  updateProfile:  (data)                 => apiClient.put('/ai/profile', data),
}

// ── Offers / Promo codes ────────────────────────────────────────────────────
export const offersApi = {
  list:         ()                           => apiClient.get('/offers'),
  validate:     (code, subtotal, customerId) =>
    apiClient.post('/offers/validate', { code, subtotal, customerId: customerId || null }),
}

// ── User Profile ────────────────────────────────────────────────────────────
export const profileApi = {
  update: (data) => apiClient.patch('/auth/profile', data),
}

// ── Health ──────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => apiClient.get('/health'),
}

export default apiClient
