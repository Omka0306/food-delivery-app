import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const ROLE_HOME = {
  customer: '/',
  restaurant: '/restaurant/dashboard',
  admin: '/admin/dashboard',
}

export default function RoleRedirect({ fallback = '/' }) {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated || !user) return <Navigate to={fallback} replace />
  return <Navigate to={ROLE_HOME[user.role] ?? fallback} replace />
}
