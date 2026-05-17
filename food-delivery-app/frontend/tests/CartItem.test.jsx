import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CartItem from '../src/components/cart/CartItem'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
}))

vi.mock('react-hot-toast', () => {
  const toast = vi.fn()
  toast.success = vi.fn()
  toast.error = vi.fn()
  return { default: toast }
})

const mockCart = {
  incrementQuantity: vi.fn(),
  decrementQuantity: vi.fn(),
  removeItem: vi.fn(),
  items: [],
  isOpen: false,
  totalItems: 0,
  totalPrice: 0,
  isInCart: vi.fn(() => false),
  getQuantity: vi.fn(() => 0),
  addItem: vi.fn(),
  openCart: vi.fn(),
  closeCart: vi.fn(),
  toggleCart: vi.fn(),
  clearCart: vi.fn(),
}

vi.mock('../src/hooks/useCart', () => ({
  default: () => mockCart,
}))

const mockItem = {
  id: 'item-002',
  name: 'Pepperoni',
  description: 'Spicy pepperoni pizza.',
  price: 14.99,
  quantity: 3,
  category: 'Pizza',
  imageUrl: 'https://example.com/pepperoni.jpg',
}

describe('CartItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders item name and total price correctly', () => {
    render(<CartItem item={mockItem} />)
    expect(screen.getByText('Pepperoni')).toBeInTheDocument()
    expect(screen.getByText('$44.97')).toBeInTheDocument()
    expect(screen.getByTestId('cart-qty')).toHaveTextContent('3')
  })

  it('calls incrementQuantity when + button is clicked', () => {
    render(<CartItem item={mockItem} />)
    fireEvent.click(screen.getByTestId('cart-increment'))
    expect(mockCart.incrementQuantity).toHaveBeenCalledWith('item-002')
  })

  it('calls decrementQuantity when - button is clicked', () => {
    render(<CartItem item={mockItem} />)
    fireEvent.click(screen.getByTestId('cart-decrement'))
    expect(mockCart.decrementQuantity).toHaveBeenCalledWith('item-002')
  })

  it('calls removeItem when trash button is clicked', () => {
    render(<CartItem item={mockItem} />)
    fireEvent.click(screen.getByTestId('cart-remove'))
    expect(mockCart.removeItem).toHaveBeenCalledWith('item-002')
  })
})
