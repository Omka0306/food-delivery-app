import { useQuery } from '@tanstack/react-query'
import { menuApi } from '@/services/api'

export default function useMenu(category) {
  return useQuery({
    queryKey: ['menu', category ?? 'All'],
    queryFn: async () => {
      const res = await menuApi.getAll(category)
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}
