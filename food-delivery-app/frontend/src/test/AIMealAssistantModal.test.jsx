import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AIMealAssistantModal from '@/components/ai/AIMealAssistantModal'

// Mock useAIChat so we control streaming state
const mockSend  = vi.fn()
const mockClear = vi.fn()
let mockMessages   = []
let mockIsStreaming = false
let mockStreamText  = ''

vi.mock('@/hooks/useAIChat', () => ({
  useAIChat: () => ({
    messages:          mockMessages,
    isStreaming:       mockIsStreaming,
    streamingText:     mockStreamText,
    sendMessage:       mockSend,
    clearConversation: mockClear,
  }),
}))

vi.mock('@/hooks/useCart', () => ({
  default: () => ({ addItem: vi.fn() }),
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
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
      div:     makeEl('div'),
      button:  makeEl('button'),
      span:    makeEl('span'),
      p:       makeEl('p'),
      section: makeEl('section'),
    },
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
  }
})

describe('AIMealAssistantModal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockMessages   = []
    mockIsStreaming = false
    mockStreamText  = ''
  })

  it('renders the modal header', () => {
    render(<AIMealAssistantModal onClose={onClose} />)
    expect(screen.getByText('QuickBite AI')).toBeInTheDocument()
  })

  it('shows the welcome message', () => {
    render(<AIMealAssistantModal onClose={onClose} />)
    expect(screen.getByText(/your QuickBite AI assistant/i)).toBeInTheDocument()
  })

  it('renders quick chips before any user message', () => {
    render(<AIMealAssistantModal onClose={onClose} />)
    expect(screen.getByText(/Spicy food/i)).toBeInTheDocument()
    expect(screen.getByText(/Healthy options/i)).toBeInTheDocument()
  })

  it('hides quick chips when messages exist', () => {
    mockMessages = [{ role: 'user', content: 'hello' }]
    render(<AIMealAssistantModal onClose={onClose} />)
    expect(screen.queryByText(/Spicy food/i)).not.toBeInTheDocument()
  })

  it('calls sendMessage when Enter key is pressed with input', async () => {
    render(<AIMealAssistantModal onClose={onClose} />)
    const input = screen.getByPlaceholderText(/ask me anything/i)
    await userEvent.type(input, 'vegan food')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockSend).toHaveBeenCalledWith('vegan food')
  })

  it('calls onClose on Escape key', () => {
    render(<AIMealAssistantModal onClose={onClose} />)
    const input = screen.getByPlaceholderText(/ask me anything/i)
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders user bubbles for user messages', () => {
    mockMessages = [{ role: 'user', content: 'I want pizza' }]
    render(<AIMealAssistantModal onClose={onClose} />)
    expect(screen.getByText('I want pizza')).toBeInTheDocument()
  })

  it('renders AI bubbles for assistant messages', () => {
    mockMessages = [{ role: 'assistant', content: 'Here are some pizza options!' }]
    render(<AIMealAssistantModal onClose={onClose} />)
    expect(screen.getByText('Here are some pizza options!')).toBeInTheDocument()
  })

  it('shows clear button after first message and calls clearConversation', () => {
    mockMessages = [{ role: 'user', content: 'hi' }]
    render(<AIMealAssistantModal onClose={onClose} />)
    const clearBtn = screen.getByTitle('Clear chat')
    expect(clearBtn).toBeInTheDocument()
    fireEvent.click(clearBtn)
    expect(mockClear).toHaveBeenCalledOnce()
  })

  it('disables input while streaming', () => {
    mockIsStreaming = true
    render(<AIMealAssistantModal onClose={onClose} />)
    expect(screen.getByPlaceholderText(/ask me anything/i)).toBeDisabled()
  })

  it('shows streaming text when AI is responding', () => {
    mockIsStreaming = true
    mockStreamText  = 'Finding great options…'
    render(<AIMealAssistantModal onClose={onClose} />)
    expect(screen.getByText('Finding great options…')).toBeInTheDocument()
  })

  it('calls onClose when the X close button is clicked', () => {
    render(<AIMealAssistantModal onClose={onClose} />)
    // The close button wraps an X icon; find it by its parent aria or class
    const closeBtn = document.querySelector('button.w-8.h-8.rounded-full')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not send when input is empty', () => {
    render(<AIMealAssistantModal onClose={onClose} />)
    const input = screen.getByPlaceholderText(/ask me anything/i)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockSend).not.toHaveBeenCalled()
  })
})
