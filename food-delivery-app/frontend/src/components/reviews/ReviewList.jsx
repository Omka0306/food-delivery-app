import StarRating from './StarRating'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export default function ReviewList({ reviews = [], emptyMessage = 'No reviews yet' }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">{emptyMessage}</p>
  }

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <span className="text-3xl font-black text-gray-800">{avg.toFixed(1)}</span>
        <div className="flex flex-col gap-0.5">
          <StarRating value={Math.round(avg)} readOnly size="sm" />
          <span className="text-xs text-gray-400">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Individual reviews */}
      {reviews.map((r) => (
        <div key={r.reviewId} className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
            {(r.customerName || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800">{r.customerName || 'Customer'}</span>
              <StarRating value={r.rating} readOnly size="sm" />
              <span className="text-xs text-gray-400 ml-auto">{timeAgo(r.createdAt)}</span>
            </div>
            {r.comment && (
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.comment}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
