import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import CheckoutForm from '../src/components/checkout/CheckoutForm'

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})
vi.mock('../src/services/api', () => ({
  ordersApi: { place: vi.fn().mockResolvedValue({ data: { data: { orderId: 'ord-123' } } }) },
}))
vi.mock('../src/store/authStore', () => ({
  useAuthStore: () => ({ user: { userId: 'user-1', name: 'Test User', role: 'customer' } }),
}))

const mockCart = {
  items: [{ id: 'i1', name: 'Margherita', price: 12.99, quantity: 1 }],
  totalPrice: 12.99,
  clearCart: vi.fn(),
  isOpen: false,
  totalItems: 1,
  isInCart: vi.fn(),
  getQuantity: vi.fn(),
  addItem: vi.fn(),
  removeItem: vi.fn(),
  incrementQuantity: vi.fn(),
  decrementQuantity: vi.fn(),
  openCart: vi.fn(),
  closeCart: vi.fn(),
  toggleCart: vi.fn(),
}

vi.mock('../src/hooks/useCart', () => ({ default: () => mockCart }))

function renderForm() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <CheckoutForm />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('CheckoutForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows validation errors when form is submitted empty', async () => {
    renderForm()
    fireEvent.click(screen.getByTestId('submit-btn'))
    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument()
    })
  })

  it('shows error for invalid phone number', async () => {
    renderForm()
    await userEvent.type(screen.getByTestId('field-phone'), '12345')
    fireEvent.click(screen.getByTestId('submit-btn'))
    await waitFor(() => {
      expect(screen.getByText(/exactly 10 digits/i)).toBeInTheDocument()
    })
  })

  it('shows error when address is too short', async () => {
    renderForm()
    await userEvent.type(screen.getByTestId('field-address'), 'short')
    fireEvent.click(screen.getByTestId('submit-btn'))
    await waitFor(() => {
      expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument()
    })
  })

  it('submits successfully with valid data', async () => {
    const { ordersApi } = await import('../src/services/api')
    renderForm()

    await userEvent.type(screen.getByTestId('field-name'), 'John Doe')
    await userEvent.type(screen.getByTestId('field-phone'), '9876543210')
    await userEvent.type(screen.getByTestId('field-address'), '123 Main Street, Mumbai 400001')

    fireEvent.click(screen.getByTestId('submit-btn'))

    await waitFor(() => {
      expect(ordersApi.place).toHaveBeenCalled()
    })
  })
})
