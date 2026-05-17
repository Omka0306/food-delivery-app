import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const SLIDES = [
  {
    id: 1,
    tag: "TODAY'S DEAL",
    headline: 'QUICKBITE',
    subline: 'SPECIALS',
    offer: 'Burgers from ₹199',
    cta: 'Order Now',
    bg: 'from-emerald-900 via-teal-800 to-emerald-700',
    tagColor: 'bg-emerald-500',
    accentColor: 'text-emerald-300',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=320&h=240&fit=crop',
    imageAlt: 'Burger',
  },
  {
    id: 2,
    tag: 'FREE DELIVERY',
    headline: 'ORDER',
    subline: 'ABOVE ₹499',
    offer: 'Zero delivery charges!',
    cta: 'Explore',
    bg: 'from-orange-600 via-orange-500 to-amber-400',
    tagColor: 'bg-amber-300',
    accentColor: 'text-amber-200',
    image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=320&h=240&fit=crop',
    imageAlt: 'Pizza',
  },
  {
    id: 3,
    tag: 'FRESHLY MADE',
    headline: 'HOT &',
    subline: 'FRESH',
    offer: 'Starting at just ₹49',
    cta: 'See Menu',
    bg: 'from-violet-900 via-purple-800 to-indigo-700',
    tagColor: 'bg-violet-400',
    accentColor: 'text-violet-300',
    image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=320&h=240&fit=crop',
    imageAlt: 'Mango Shake',
  },
]

const INTERVAL_MS = 4000

export default function PromoBanner({ onCtaClick }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), [])
  const prev = useCallback(() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length), [])

  useEffect(() => {
    if (paused) return
    const id = setInterval(next, INTERVAL_MS)
    return () => clearInterval(id)
  }, [paused, next])

  const slide = SLIDES[current]

  return (
    <div
      className="relative rounded-2xl overflow-hidden select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className={`bg-gradient-to-r ${slide.bg} flex items-center justify-between px-6 py-5 min-h-[160px] sm:min-h-[180px]`}
        >
          {/* Text side */}
          <div className="flex-1 min-w-0 z-10">
            <span className={`inline-block ${slide.tagColor} text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 uppercase tracking-wider`}>
              {slide.tag}
            </span>
            <h2 className="text-white font-black leading-none tracking-tight" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.6rem)' }}>
              {slide.headline}
            </h2>
            <h2 className={`${slide.accentColor} font-black leading-none tracking-tight mb-2`} style={{ fontSize: 'clamp(1.6rem, 5vw, 2.6rem)' }}>
              {slide.subline}
            </h2>
            <p className="text-white/80 text-sm font-medium mb-3">{slide.offer}</p>
            <button
              onClick={onCtaClick}
              className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all duration-150 shadow-md"
            >
              {slide.cta} →
            </button>
          </div>

          {/* Image side */}
          <div className="flex-shrink-0 ml-4 relative">
            <motion.img
              key={slide.id + '-img'}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              src={slide.image}
              alt={slide.imageAlt}
              className="w-28 h-28 sm:w-36 sm:h-36 object-cover rounded-2xl shadow-2xl"
              draggable={false}
            />
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-2xl ring-4 ring-white/20 pointer-events-none" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/25 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/25 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current ? 'bg-white w-5 h-2' : 'bg-white/50 w-2 h-2'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
