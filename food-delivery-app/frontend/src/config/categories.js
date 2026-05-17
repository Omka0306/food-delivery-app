// Central category registry — used by restaurant add/edit form, customer filters, and card display.
// Add any new category here and it automatically appears everywhere.

export const PRESET_CATEGORIES = [
  { label: 'Biryani',    emoji: '🍛', bg: 'bg-yellow-50'  },
  { label: 'Dosa',       emoji: '🥞', bg: 'bg-amber-50'   },
  { label: 'Thali',      emoji: '🍽️', bg: 'bg-orange-50'  },
  { label: 'Dal & Rice', emoji: '🍲', bg: 'bg-lime-50'    },
  { label: 'Tandoor',    emoji: '🔥', bg: 'bg-red-50'     },
  { label: 'Pizza',      emoji: '🍕', bg: 'bg-red-50'     },
  { label: 'Burgers',    emoji: '🍔', bg: 'bg-yellow-50'  },
  { label: 'Wraps',      emoji: '🌯', bg: 'bg-green-50'   },
  { label: 'Sandwiches', emoji: '🥪', bg: 'bg-amber-50'   },
  { label: 'Pasta',      emoji: '🍝', bg: 'bg-yellow-50'  },
  { label: 'Chinese',    emoji: '🥡', bg: 'bg-red-50'     },
  { label: 'Noodles',    emoji: '🍜', bg: 'bg-orange-50'  },
  { label: 'Soups',      emoji: '🍵', bg: 'bg-blue-50'    },
  { label: 'Salads',     emoji: '🥗', bg: 'bg-green-50'   },
  { label: 'Seafood',    emoji: '🦞', bg: 'bg-blue-50'    },
  { label: 'Snacks',     emoji: '🍿', bg: 'bg-amber-50'   },
  { label: 'Sides',      emoji: '🍟', bg: 'bg-green-50'   },
  { label: 'Desserts',   emoji: '🍰', bg: 'bg-pink-50'    },
  { label: 'Drinks',     emoji: '🥤', bg: 'bg-blue-50'    },
  { label: 'Breakfast',  emoji: '🍳', bg: 'bg-yellow-50'  },
]

// Build lookup maps for fast access
const emojiMap = Object.fromEntries(PRESET_CATEGORIES.map((c) => [c.label, c.emoji]))
const bgMap    = Object.fromEntries(PRESET_CATEGORIES.map((c) => [c.label, c.bg]))

export function getCategoryEmoji(label) {
  return emojiMap[label] || '🍽️'
}

export function getCategoryBg(label) {
  return bgMap[label] || 'bg-gray-50'
}

// Labels only (for dropdowns)
export const PRESET_CATEGORY_LABELS = PRESET_CATEGORIES.map((c) => c.label)
