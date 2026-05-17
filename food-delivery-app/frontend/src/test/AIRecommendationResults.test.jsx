import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AIRecommendationResults from '@/components/ai/AIRecommendationResults'
import { aiApi } from '@/services/aiApi'

vi.mock('@/services/aiApi', () => ({
  aiApi: { sendFeedback: vi.fn().mockResolvedValue({}) },
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/hooks/useCart', () => ({
  default: () => ({ addItem: vi.fn() }),
}))

vi.mock('framer-motion', () => {
  const ANIM_PROPS = ['whileTap','whileHover','animate','initial','exit','transition','layoutId','layout','variants']
  const makeEl = (tag) => {
    const C = ({ children, ...rest }) => {
      const domProps = Object.fromEntries(Object.entries(rest).filter(([k]) => !ANIM_PROPS.includes(k)))
      return React.createElement(tag, domProps, children)
    }
    C.displayName = `motion.${tag}`
    return C
  }
  return {
    motion: {
      div:    makeEl('div'),
      button: makeEl('button'),
      span:   makeEl('span'),
      circle: makeEl('circle'),
    },
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
  }
})

const sampleItem = {
  menuItemId:   'item-1',
  name:         'Spicy Burger',
  price:        199,
  restaurantId: 'rest-1',
  imageUrl:     null,
  reason:       'Great spice level',
  isVeg:        false,
  spiceLevel:   2,
  healthScore:  5,
  calories:     450,
}

describe('AIRecommendationResults', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows skeleton loader text when loading', () => {
    render(<AIRecommendationResults isLoading={true} />)
    expect(screen.getByText(/finding the perfect meal/i)).toBeInTheDocument()
  })

  it('shows rate-limit error UI', () => {
    render(<AIRecommendationResults error={{ type: 'rate_limit', resetMs: 60000 }} />)
    expect(screen.getByText(/recommendation limit/i)).toBeInTheDocument()
    expect(screen.getByText(/available again in/i)).toBeInTheDocument()
  })

  it('shows rate-limit countdown in MM:SS format', () => {
    render(<AIRecommendationResults error={{ type: 'rate_limit', resetMs: 90000 }} />)
    expect(screen.getByText(/01:30/)).toBeInTheDocument()
  })

  it('shows general error UI with retry button', () => {
    const onRetry = vi.fn()
    render(<AIRecommendationResults error={{ type: 'general', message: 'Oops' }} onRetry={onRetry} />)
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText(/try again/i))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('shows empty state when no recommendations', () => {
    render(<AIRecommendationResults recommendations={[]} />)
    expect(screen.getByText(/nothing matched exactly/i)).toBeInTheDocument()
  })

  it('renders recommendation card with name and price', () => {
    render(<AIRecommendationResults recommendations={[sampleItem]} greeting="Here is your pick!" />)
    expect(screen.getByText('Spicy Burger')).toBeInTheDocument()
    expect(screen.getByText(/₹199/)).toBeInTheDocument()
  })

  it('shows AI reason text', () => {
    render(<AIRecommendationResults recommendations={[sampleItem]} greeting="Pick!" />)
    expect(screen.getByText(/great spice level/i)).toBeInTheDocument()
  })

  it('shows Non-Veg tag', () => {
    render(<AIRecommendationResults recommendations={[sampleItem]} greeting="Pick!" />)
    expect(screen.getByText('Non-Veg')).toBeInTheDocument()
  })

  it('shows feedback row with thumbs up / down', () => {
    render(<AIRecommendationResults recommendations={[sampleItem]} greeting="Pick!" />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('calls sendFeedback and hides feedback row on thumbs up', () => {
    render(<AIRecommendationResults recommendations={[sampleItem]} greeting="Pick!" />)
    fireEvent.click(screen.getByText('Yes'))
    expect(aiApi.sendFeedback).toHaveBeenCalledWith(null, null, 'up')
    expect(screen.queryByText('Yes')).not.toBeInTheDocument()
  })

  it('shows tip when provided', () => {
    render(<AIRecommendationResults recommendations={[sampleItem]} greeting="Pick!" tip="Add extra sauce!" />)
    expect(screen.getByText('Add extra sauce!')).toBeInTheDocument()
  })
})
