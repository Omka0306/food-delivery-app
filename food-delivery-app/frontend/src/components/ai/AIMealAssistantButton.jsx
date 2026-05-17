import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import AIMealAssistantModal from './AIMealAssistantModal'

export default function AIMealAssistantButton() {
  const [open,   setOpen]   = useState(false)
  const [isNew,  setIsNew]  = useState(false)

  useEffect(() => {
    setIsNew(!localStorage.getItem('ai-assistant-used'))
  }, [])

  const handleOpen = () => {
    setOpen(true)
    setIsNew(false)
    localStorage.setItem('ai-assistant-used', '1')
  }

  return (
    <>
      {/* Floating button */}
      <motion.div
        className="fixed bottom-24 right-5 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1 }}
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-30 pointer-events-none" />

        <motion.button
          onClick={handleOpen}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open AI Meal Assistant"
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-400/40 flex items-center justify-center text-white"
        >
          <Sparkles className="w-6 h-6" />

          {/* NEW badge */}
          <AnimatePresence>
            {isNew && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1.5 -right-1.5 bg-amber-400 text-[9px] font-extrabold text-white px-1.5 py-0.5 rounded-full leading-none shadow"
              >
                NEW
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="absolute right-16 top-1/2 -translate-y-1/2 pointer-events-none"
        >
          <div className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
            AI Meal Assistant
            <span className="absolute right-[-5px] top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
          </div>
        </motion.div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {open && <AIMealAssistantModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
