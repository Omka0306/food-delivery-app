import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  useEffect(() => {
    document.title = '404 — QuickBite'
  }, [])

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-8xl mb-6">🍔</div>
        <h1 className="text-5xl font-bold text-gray-800 mb-3">404</h1>
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Oops! Page not found</h2>
        <p className="text-gray-400 mb-8">
          Looks like this page went on a food run and never came back.
        </p>
        <Button asChild className="rounded-full px-8">
          <Link to="/">← Back to Menu</Link>
        </Button>
      </motion.div>
    </div>
  )
}
