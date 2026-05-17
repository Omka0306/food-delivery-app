import apiClient from './apiClient'

const authApi = {
  register: (data) => apiClient.post('/auth/register', data),

  registerRestaurant: (data) => apiClient.post('/auth/register/restaurant', data),

  verify: (email, code) => apiClient.post('/auth/verify', { email, code }),

  login: (email, password) => apiClient.post('/auth/login', { email, password }),

  logout: (idToken) =>
    apiClient.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${idToken}` } }),

  getMe: (idToken) =>
    apiClient.get('/auth/me', { headers: { Authorization: `Bearer ${idToken}` } }),

  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),

  resendVerification: (email) => apiClient.post('/auth/resend-verification', { email }),
}

export default authApi
