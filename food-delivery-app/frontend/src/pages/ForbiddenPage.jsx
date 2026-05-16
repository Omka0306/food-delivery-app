import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

export default function ForbiddenPage() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldOff className="w-10 h-10 text-red-500" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Access Denied</h1>
        <p className="text-gray-500">
          {user
            ? `Your account role (${user.role}) doesn't have permission to view this page.`
            : 'You do not have permission to view this page.'}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button asChild>
            <Link to="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
