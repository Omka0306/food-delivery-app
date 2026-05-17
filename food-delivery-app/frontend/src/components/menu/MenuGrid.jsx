import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import MenuCard from './MenuCard'
import MenuSkeleton from './MenuSkeleton'

export default function MenuGrid({ data, isLoading, isError, refetch }) {
  if (isLoading) return <MenuSkeleton />

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-500 font-medium">Failed to load menu. Please try again.</p>
        <Button onClick={refetch} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-6xl">🍽️</span>
        <p className="text-gray-500 font-medium text-lg">No items in this category</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((item, index) => (
        <MenuCard key={item.id} item={item} index={index} />
      ))}
    </div>
  )
}
