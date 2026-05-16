import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import RestaurantDashboard from '../src/pages/restaurant/RestaurantDashboard'

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

vi.mock('../src/store/authStore', () => ({
  useAuthStore: () => ({ user: { restaurantId: 'rest-1', name: 'Test Restaurant', role: 'restaurant' } }),
}))

vi.mock('../src/hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(),
}))

const { mockOrders, mockAnalytics, mockUpdateStatus } = vi.hoisted(() => {
  const mockOrders = [
    {
      orderId: 'order-aabbcc112233',
      customerName: 'Alice Smith',
      status: 'Order Received',
      items: [{ name: 'Burger', quantity: 1, price: 150 }],
      total: 150,
      createdAt: new Date().toISOString(),
    },
    {
      orderId: 'order-ddeeff445566',
      customerName: 'Bob Jones',
      status: 'Preparing',
      items: [{ name: 'Pizza', quantity: 2, price: 200 }],
      total: 400,
      createdAt: new Date().toISOString(),
    },
  ]
  const mockAnalytics = { totalOrders: 42, revenue: 15000, rating: 4 }
  const mockUpdateStatus = vi.fn().mockResolvedValue({})
  return { mockOrders, mockAnalytics, mockUpdateStatus }
})

vi.mock('../src/services/api', () => ({
  restaurantApi: {
    getOrders: vi.fn().mockResolvedValue({ data: { data: mockOrders } }),
    getAnalytics: vi.fn().mockResolvedValue({ data: { data: mockAnalytics } }),
    updateOrderStatus: mockUpdateStatus,
  },
}))

function renderDashboard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <RestaurantDashboard />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('RestaurantDashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders stat cards section', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByTestId('stats-cards')).toBeInTheDocument()
    })
    expect(screen.getByText('Total Orders')).toBeInTheDocument()
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Rating')).toBeInTheDocument()
  })

  it('renders pending orders list', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByTestId('pending-orders')).toBeInTheDocument()
    })
    expect(screen.getAllByText(/Alice Smith/i).length).toBeGreaterThan(0)
  })

  it('shows Accept and Reject buttons for pending orders', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByTestId('pending-orders')).toBeInTheDocument()
    })
    expect(screen.getByTestId('accept-btn')).toBeInTheDocument()
    expect(screen.getByTestId('reject-btn')).toBeInTheDocument()
  })

  it('opens accept modal when Accept is clicked', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByTestId('accept-btn')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('accept-btn'))
    await waitFor(() => {
      expect(screen.getByText(/accept order/i)).toBeInTheDocument()
      expect(screen.getByText(/estimated preparation time/i)).toBeInTheDocument()
    })
  })

  it('opens reject modal when Reject is clicked and requires reason', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByTestId('reject-btn')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('reject-btn'))
    await waitFor(() => {
      expect(screen.getByText(/reject order/i)).toBeInTheDocument()
    })
    const rejectConfirmBtns = screen.getAllByRole('button', { name: /^reject$/i })
    const confirmBtn = rejectConfirmBtns.find((b) => b.closest('[class*="shadow-2xl"]') || b.disabled !== undefined)
    expect(confirmBtn).toBeDefined()
    const disabledBtn = rejectConfirmBtns.find((b) => b.disabled)
    expect(disabledBtn).toBeTruthy()
  })
})
