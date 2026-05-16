import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../src/components/routing/ProtectedRoute'

const mockAuthState = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null,
}))

vi.mock('../src/store/authStore', () => ({
  useAuthStore: () => mockAuthState,
}))

function renderRoute({ isAuthenticated, user, allowedRoles, children = <div>Protected Content</div> }) {
  mockAuthState.isAuthenticated = isAuthenticated
  mockAuthState.user = user
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              {children}
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/403" element={<div>Forbidden</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    renderRoute({ isAuthenticated: false, user: null })
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated with no role restriction', () => {
    renderRoute({ isAuthenticated: true, user: { role: 'customer' } })
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('renders children when user has correct role', () => {
    renderRoute({ isAuthenticated: true, user: { role: 'customer' }, allowedRoles: ['customer'] })
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to /403 when user has wrong role', () => {
    renderRoute({ isAuthenticated: true, user: { role: 'customer' }, allowedRoles: ['admin'] })
    expect(screen.getByText('Forbidden')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('allows restaurant role to access restaurant-only routes', () => {
    renderRoute({ isAuthenticated: true, user: { role: 'restaurant' }, allowedRoles: ['restaurant'] })
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('blocks customer from admin-only routes', () => {
    renderRoute({ isAuthenticated: true, user: { role: 'customer' }, allowedRoles: ['admin'] })
    expect(screen.getByText('Forbidden')).toBeInTheDocument()
  })
})
