import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import authApi from '../services/authApi'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async ({ email, password }) => {
        set({ isLoading: true })
        try {
          const loginRes = await authApi.login(email, password)
          const { idToken, refreshToken } = loginRes.data.data

          const meRes = await authApi.getMe(idToken)
          const user = meRes.data.data

          set({
            user,
            accessToken: idToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })

          return user
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: async () => {
        const { accessToken } = get()
        try {
          if (accessToken) await authApi.logout(accessToken)
        } catch (_) {}
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      refreshAccessToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) throw new Error('No refresh token available')
        const res = await authApi.refresh(refreshToken)
        const { idToken } = res.data.data
        set({ accessToken: idToken })
        return idToken
      },
    }),
    {
      name: 'quickbite-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
