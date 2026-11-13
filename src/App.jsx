import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import { AdminRoute, Navbar, ProtectedRoute, StoreFooter } from './components/common';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import { PaymentsPage } from './pages/PaymentsPage';
import { CouponsPage } from './pages/CouponsPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { InventoryPage } from './pages/InventoryPage';
import { PaymentResultPage } from './pages/PaymentResultPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { WishlistPage } from './pages/WishlistPage';
import { AdminCustomerProfilePage } from './pages/AdminCustomerProfilePage';

function AppWithAuth() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<ProductsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/login" element={loading ? <div className="loading">Loading...</div> : !isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/register" element={loading ? <div className="loading">Loading...</div> : !isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:orderId/track" element={<ProtectedRoute><OrderTrackingPage /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
        <Route path="/payment/success" element={<ProtectedRoute><PaymentResultPage outcome="success" /></ProtectedRoute>} />
        <Route path="/payment/failed" element={<ProtectedRoute><PaymentResultPage outcome="failed" /></ProtectedRoute>} />
        <Route path="/payment/cancelled" element={<ProtectedRoute><PaymentResultPage outcome="cancelled" /></ProtectedRoute>} />
        <Route path="/coupons" element={<CouponsPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/reviews/:productId" element={<ReviewsPage />} />
        <Route path="/inventory" element={<AdminRoute><InventoryPage /></AdminRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/customers/:customerId" element={<AdminRoute><AdminCustomerProfilePage /></AdminRoute>} />
      </Routes>
      <StoreFooter />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}
