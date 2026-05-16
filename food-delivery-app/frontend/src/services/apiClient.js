import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL

if (!BASE_URL) {
  console.error('[apiClient] VITE_API_URL is not set. Check your .env file.')
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    // Pass through errors that api.js already processed (they have no .response)
    if (!err.response) return Promise.reject(err)
    const message =
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

export default apiClient
