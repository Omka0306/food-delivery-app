import { Badge } from '@/components/ui/badge'

const STATUS_CONFIG = {
  'Order Received': { variant: 'warning', emoji: '📋' },
  Preparing: { variant: 'warning', emoji: '👨‍🍳' },
  'Out for Delivery': { variant: 'default', emoji: '🛵' },
  Delivered: { variant: 'success', emoji: '✅' },
}

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { variant: 'outline', emoji: '❓' }
  return (
    <Badge variant={config.variant} className="text-sm px-3 py-1 font-semibold">
      {config.emoji} {status}
    </Badge>
  )
}
