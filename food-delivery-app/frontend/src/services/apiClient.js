import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL

if (!BASE_URL) {
  console.error('[apiClient] VITE_API_URL is not set. Check your .env file.')
}

// Thin axios instance — all error handling lives in api.js interceptors
// so that the 401 → refresh → retry flow sees raw Axios errors (with .response).
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

export default apiClient
