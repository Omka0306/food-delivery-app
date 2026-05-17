import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import ProtectedRoute from '@/components/routing/ProtectedRoute'
import RoleRedirect from '@/components/routing/RoleRedirect'

import HomePage from '@/pages/HomePage'
import CheckoutPage from '@/pages/CheckoutPage'
import OrderStatusPage from '@/pages/OrderStatusPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ForbiddenPage from '@/pages/ForbiddenPage'

import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import RestaurantRegisterPage from '@/pages/auth/RestaurantRegisterPage'

import MyOrdersPage from '@/pages/customer/MyOrdersPage'
import RestaurantsPage from '@/pages/RestaurantsPage'
import RestaurantPublicMenuPage from '@/pages/RestaurantPublicMenuPage'

import RestaurantLayout from '@/layouts/RestaurantLayout'
import AdminLayout from '@/layouts/AdminLayout'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])
  return null
}

function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const isAdminOrRestaurant =
    location.pathname.startsWith('/restaurant') || location.pathname.startsWith('/admin')

  if (isAdminOrRestaurant) {
    return (
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px' },
            success: { duration: 2500 },
            error: { duration: 3500 },
          }}
        />
        <ScrollToTop />
        <Routes>
          <Route
            path="/restaurant/*"
            element={
              <ProtectedRoute allowedRoles={['restaurant']}>
                <RestaurantLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px' },
          success: { duration: 2500 },
          error: { duration: 3500 },
        }}
      />
      <ScrollToTop />
      <Navbar />
      <CartDrawer />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/restaurants" element={<RestaurantsPage />} />
            <Route path="/restaurants/:restaurantId" element={<RestaurantPublicMenuPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/register/restaurant" element={<RestaurantRegisterPage />} />
            <Route path="/403" element={<ForbiddenPage />} />

            {/* Customer protected */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <MyOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route path="/order/:orderId" element={<OrderStatusPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </main>

      {!location.pathname.startsWith('/order/') && <Footer />}
    </div>
  )
}
