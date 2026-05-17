import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MenuCard from '../src/components/menu/MenuCard'

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

const mockCart = {
  items: [],
  addItem: vi.fn(),
  incrementQuantity: vi.fn(),
  decrementQuantity: vi.fn(),
  isInCart: vi.fn(() => false),
  getQuantity: vi.fn(() => 0),
  totalItems: 0,
  totalPrice: 0,
  isOpen: false,
  openCart: vi.fn(),
  closeCart: vi.fn(),
  toggleCart: vi.fn(),
  clearCart: vi.fn(),
  removeItem: vi.fn(),
}

vi.mock('../src/hooks/useCart', () => ({
  default: () => mockCart,
}))

const mockItem = {
  id: 'item-001',
  name: 'Margherita',
  description: 'Classic tomato base with fresh mozzarella.',
  price: 12.99,
  category: 'Pizza',
  imageUrl: 'https://example.com/pizza.jpg',
  rating: 4.5,
  prepTime: '10-15 mins',
  available: true,
}

describe('MenuCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCart.isInCart.mockReturnValue(false)
    mockCart.getQuantity.mockReturnValue(0)
  })

  it('renders item name, price, and description', () => {
    render(<MenuCard item={mockItem} index={0} />)
    expect(screen.getByText('Margherita')).toBeInTheDocument()
    expect(screen.getByText('₹12.99')).toBeInTheDocument()
    expect(screen.getByText(/Classic tomato base/)).toBeInTheDocument()
  })

  it('shows Add button when item is not in cart', () => {
    render(<MenuCard item={mockItem} index={0} />)
    expect(screen.getByTestId('add-btn')).toBeInTheDocument()
    expect(screen.queryByTestId('qty-control')).not.toBeInTheDocument()
  })

  it('calls addItem when Add button is clicked', () => {
    render(<MenuCard item={mockItem} index={0} />)
    fireEvent.click(screen.getByTestId('add-btn'))
    expect(mockCart.addItem).toHaveBeenCalledWith(mockItem)
  })

  it('shows quantity controls when item is in cart', () => {
    mockCart.isInCart.mockReturnValue(true)
    mockCart.getQuantity.mockReturnValue(2)

    render(<MenuCard item={mockItem} index={0} />)

    expect(screen.queryByTestId('add-btn')).not.toBeInTheDocument()
    expect(screen.getByTestId('qty-control')).toBeInTheDocument()
    expect(screen.getByTestId('qty-value')).toHaveTextContent('2')
  })

  it('calls incrementQuantity when + is clicked in cart mode', () => {
    mockCart.isInCart.mockReturnValue(true)
    mockCart.getQuantity.mockReturnValue(1)

    render(<MenuCard item={mockItem} index={0} />)
    fireEvent.click(screen.getByTestId('increment-btn'))
    expect(mockCart.incrementQuantity).toHaveBeenCalledWith('item-001')
  })

  it('calls decrementQuantity when - is clicked in cart mode', () => {
    mockCart.isInCart.mockReturnValue(true)
    mockCart.getQuantity.mockReturnValue(2)

    render(<MenuCard item={mockItem} index={0} />)
    fireEvent.click(screen.getByTestId('decrement-btn'))
    expect(mockCart.decrementQuantity).toHaveBeenCalledWith('item-001')
  })
})
