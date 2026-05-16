import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../src/pages/auth/LoginPage'

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  }
})

vi.mock('../src/services/authApi', () => ({
  default: { resendVerification: vi.fn() },
}))

const mockLogin = vi.fn()
const mockStore = { login: mockLogin, isLoading: false, isAuthenticated: false, user: null }

vi.mock('../src/store/authStore', () => ({
  useAuthStore: () => mockStore,
}))

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <LoginPage />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.isAuthenticated = false
    mockStore.user = null
  })

  it('renders email and password fields', () => {
    renderPage()
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-btn')).toBeInTheDocument()
  })

  it('shows error message when login fails with bad credentials', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Incorrect username or password'))
    renderPage()

    await userEvent.type(screen.getByTestId('email-input'), 'bad@example.com')
    await userEvent.type(screen.getByTestId('password-input'), 'wrongpass')
    fireEvent.click(screen.getByTestId('submit-btn'))

    await waitFor(() => {
      expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument()
    })
  })

  it('shows unverified email prompt for unconfirmed users', async () => {
    mockLogin.mockRejectedValueOnce(new Error('User is not confirmed'))
    renderPage()

    await userEvent.type(screen.getByTestId('email-input'), 'user@example.com')
    await userEvent.type(screen.getByTestId('password-input'), 'Password1!')
    fireEvent.click(screen.getByTestId('submit-btn'))

    await waitFor(() => {
      expect(screen.getByText(/email not verified/i)).toBeInTheDocument()
      expect(screen.getByText(/resend verification email/i)).toBeInTheDocument()
    })
  })

  it('calls login with correct credentials on submit', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'customer', name: 'Test User' })
    renderPage()

    await userEvent.type(screen.getByTestId('email-input'), 'user@example.com')
    await userEvent.type(screen.getByTestId('password-input'), 'Password1!')
    fireEvent.click(screen.getByTestId('submit-btn'))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Password1!',
      })
    })
  })

  it('shows Sign In button text by default', () => {
    renderPage()
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Sign In')
  })
})
