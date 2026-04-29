import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import AdminProtectedRoute from "./admin/AdminProtectedRoute";

// Layout components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import WhatsAppButton from "./components/WhatsAppButton";

// Customer pages
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import TrackOrder from "./pages/TrackOrder";
import ExchangePolicy from "./pages/ExchangePolicy";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLogin from "./admin/pages/AdminLogin";
import AdminSignup from "./admin/pages/AdminSignup";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminProducts from "./admin/pages/AdminProducts";
import AdminProductForm from "./admin/pages/AdminProductForm";
import AdminOrders from "./admin/pages/AdminOrders";
import AdminOrderDetails from "./admin/pages/AdminOrderDetails";
import AdminUsers from "./admin/pages/AdminUsers";

function CustomerLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Routes>
                {/* ── Customer Routes ── */}
                <Route
                  path="/"
                  element={
                    <CustomerLayout>
                      <Home />
                    </CustomerLayout>
                  }
                />
                <Route
                  path="/category/:slug"
                  element={
                    <CustomerLayout>
                      <CategoryPage />
                    </CustomerLayout>
                  }
                />
                <Route
                  path="/product/:slug"
                  element={
                    <CustomerLayout>
                      <ProductDetails />
                    </CustomerLayout>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <CustomerLayout>
                      <Cart />
                    </CustomerLayout>
                  }
                />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success/:orderNumber" element={<OrderSuccess />} />
                <Route
                  path="/track-order"
                  element={
                    <CustomerLayout>
                      <TrackOrder />
                    </CustomerLayout>
                  }
                />
                <Route
                  path="/exchange-policy"
                  element={
                    <CustomerLayout>
                      <ExchangePolicy />
                    </CustomerLayout>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <CustomerLayout>
                      <Search />
                    </CustomerLayout>
                  }
                />

                {/* ── Admin Public Routes ── */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/signup" element={<AdminSignup />} />

                {/* ── Admin Protected Routes ── */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <AdminProtectedRoute>
                      <AdminProducts />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products/new"
                  element={
                    <AdminProtectedRoute>
                      <AdminProductForm />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products/:id/edit"
                  element={
                    <AdminProtectedRoute>
                      <AdminProductForm />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <AdminProtectedRoute>
                      <AdminOrders />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders/:id"
                  element={
                    <AdminProtectedRoute>
                      <AdminOrderDetails />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/admins"
                  element={
                    <AdminProtectedRoute superAdminOnly>
                      <AdminUsers />
                    </AdminProtectedRoute>
                  }
                />

                {/* ── 404 ── */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
