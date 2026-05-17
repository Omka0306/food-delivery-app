import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Trash2, Send, ShoppingCart, Check } from 'lucide-react'
import { useAIChat } from '@/hooks/useAIChat'
import useCart from '@/hooks/useCart'
import toast from 'react-hot-toast'

const WELCOME = `Hey! I'm your QuickBite AI assistant 🍽️

Tell me what you're craving and I'll find the perfect match! You can ask me things like:
• "Something spicy under ₹200"
• "High protein post-workout meal"
• "No onion garlic comfort food"

What are you in the mood for? 🌟`

const QUICK_CHIPS = [
  { emoji: '🌶️', label: 'Spicy food'     },
  { emoji: '🥗', label: 'Healthy options' },
  { emoji: '💰', label: 'Budget meal'     },
  { emoji: '🌿', label: 'Vegetarian'      },
]

// ── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-end gap-1 px-4 py-3 bg-gray-100 rounded-2xl rounded-tl-sm w-fit">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400 inline-block"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

// ── Add-to-cart button inside a chat bubble ──────────────────────────────────
function InlineAddButton({ item }) {
  const [added, setAdded] = useState(false)
  const { addItem }       = useCart()

  const handleAdd = () => {
    addItem({ id: item.menuItemId, name: item.name, price: item.price, restaurantId: item.restaurantId, imageUrl: item.imageUrl || null })
    setAdded(true)
    toast.success(`${item.name} added! 🛒`)
  }

  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={handleAdd}
      disabled={added}
      className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full transition-all ${
        added ? 'bg-green-500 text-white' : 'bg-white text-primary border border-primary hover:bg-orange-50'
      }`}
    >
      {added ? <Check className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
      {added ? 'Added!' : `Add ₹${item.price}`}
    </motion.button>
  )
}

// ── AI message bubble ────────────────────────────────────────────────────────
function AIBubble({ content, isStreaming, streamingText, recommendations }) {
  const text = isStreaming ? streamingText : content
  return (
    <div className="flex items-end gap-2 max-w-[85%]">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mb-0.5">
        <Sparkles className="w-3 h-3 text-white" />
      </div>
      <div className="space-y-2">
        <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed">
          <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>
          {isStreaming && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-0.5 h-4 bg-gray-500 ml-0.5 align-middle"
            />
          )}
        </div>

        {/* Inline recommendation cards */}
        {recommendations?.length > 0 && (
          <div className="space-y-1.5">
            {recommendations.map((item, i) => (
              <motion.div
                key={item.menuItemId || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl border border-gray-200 p-2.5 flex items-center gap-2.5"
              >
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none' }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                  {item.reason && (
                    <p className="text-[10px] italic text-purple-600 truncate">{item.reason}</p>
                  )}
                </div>
                <InlineAddButton item={item} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── User message bubble ──────────────────────────────────────────────────────
function UserBubble({ content }) {
  return (
    <div className="flex justify-end">
      <div className="bg-orange-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[80%] leading-relaxed">
        {content}
      </div>
    </div>
  )
}

// ── Main modal ───────────────────────────────────────────────────────────────
export default function AIMealAssistantModal({ onClose }) {
  const { messages, isStreaming, streamingText, sendMessage, clearConversation } = useAIChat()
  const [input,   setInput]   = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Focus input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [])

  const handleSend = () => {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    sendMessage(text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    if (e.key === 'Escape') onClose()
  }

  const handleChip = (label) => {
    if (isStreaming) return
    sendMessage(label)
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="w-full max-w-lg h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-gray-900 text-base leading-tight">QuickBite AI</h2>
              <p className="text-xs text-gray-400">Your personal foodie sidekick 🍽️</p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                title="Clear chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Welcome message */}
            <AIBubble content={WELCOME} isStreaming={false} streamingText="" />

            {/* Conversation */}
            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <UserBubble key={i} content={msg.content} />
              ) : (
                <AIBubble key={i} content={msg.content} isStreaming={false} streamingText="" recommendations={msg.recommendations} />
              )
            )}

            {/* Streaming response */}
            <AnimatePresence>
              {isStreaming && streamingText && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <AIBubble content="" isStreaming streamingText={streamingText} />
                </motion.div>
              )}
              {isStreaming && !streamingText && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-end gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 border-t border-gray-100 px-4 pb-4 pt-3 space-y-2">
            {/* Quick chips — only before first user message */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-1.5">
                {QUICK_CHIPS.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => handleChip(`${c.emoji} ${c.label}`)}
                    disabled={isStreaming}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 disabled:opacity-50 transition-all"
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                placeholder="Ask me anything about food…"
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:opacity-50 transition-all"
              />
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleSend}
                disabled={isStreaming || !input.trim()}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
