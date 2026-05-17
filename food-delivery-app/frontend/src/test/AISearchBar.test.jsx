import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AISearchBar from '@/components/ai/AISearchBar'
import { aiApi } from '@/services/aiApi'

vi.mock('@/services/aiApi', () => ({
  aiApi: {
    quickSuggestions: vi.fn().mockResolvedValue({ data: { data: { suggestions: [] } } }),
  },
}))

// Render motion.X as the real HTML element X, strip animation props
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
    },
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
  }
})

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('AISearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders the input and Ask AI button', () => {
    wrap(<AISearchBar onSearch={vi.fn()} isLoading={false} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByText('Ask AI')).toBeInTheDocument()
  })

  it('shows AI Meal Assistant label', () => {
    wrap(<AISearchBar onSearch={vi.fn()} isLoading={false} />)
    expect(screen.getByText('AI Meal Assistant')).toBeInTheDocument()
  })

  it('calls onSearch when Enter is pressed with non-empty input', async () => {
    const onSearch = vi.fn()
    wrap(<AISearchBar onSearch={onSearch} isLoading={false} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'spicy food')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSearch).toHaveBeenCalledWith('spicy food')
  })

  it('calls onSearch when Ask AI button is clicked', async () => {
    const onSearch = vi.fn()
    wrap(<AISearchBar onSearch={onSearch} isLoading={false} />)
    await userEvent.type(screen.getByRole('textbox'), 'burger')
    fireEvent.click(screen.getByText('Ask AI'))
    expect(onSearch).toHaveBeenCalledWith('burger')
  })

  it('does not call onSearch when input is empty', () => {
    const onSearch = vi.fn()
    wrap(<AISearchBar onSearch={onSearch} isLoading={false} />)
    fireEvent.click(screen.getByText('Ask AI'))
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('disables input and all chip buttons while loading', async () => {
    wrap(<AISearchBar onSearch={vi.fn()} isLoading={true} />)
    expect(screen.getByRole('textbox')).toBeDisabled()
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => expect(btn).toBeDisabled())
  })

  it('shows NEW badge when ai-assistant-used is not in localStorage', () => {
    wrap(<AISearchBar onSearch={vi.fn()} isLoading={false} />)
    expect(screen.getByText('NEW')).toBeInTheDocument()
  })

  it('hides NEW badge when ai-assistant-used is set', () => {
    localStorage.setItem('ai-assistant-used', '1')
    wrap(<AISearchBar onSearch={vi.fn()} isLoading={false} />)
    expect(screen.queryByText('NEW')).not.toBeInTheDocument()
  })
})
