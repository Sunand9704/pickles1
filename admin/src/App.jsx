import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";

import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AdminForgotPassword from "./pages/auth/AdminForgotPassword";
import AdminOTPVerification from "./pages/auth/AdminOTPVerification";
import AdminResetPassword from "./pages/auth/AdminResetPassword";

// Reads the JWT's payload client-side (no verification — the backend does
// that on every request) just to check expiry before trusting the token
// enough to render the admin shell.
const decodeJwtPayload = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
};

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const rawUser = localStorage.getItem("adminUser");

    let valid = false;
    if (token && rawUser) {
      const payload = decodeJwtPayload(token);
      const isExpired = !payload?.exp || payload.exp * 1000 <= Date.now();
      let user = null;
      try {
        user = JSON.parse(rawUser);
      } catch (_) {
        user = null;
      }
      valid = !isExpired && user?.role === 'admin';
    }

    if (!valid) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
    }

    setIsAuthenticated(valid);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* New Admin Forgot Password Routes */}
        <Route path="/admin-forgot-password" element={<AdminForgotPassword />} />
        <Route path="/admin-verify-otp" element={<AdminOTPVerification />} />
        <Route path="/admin-reset-password" element={<AdminResetPassword />} />

        <Route
          path="/*"
          element={
            <PrivateRoute>
              <div className="min-h-screen bg-gray-50 overflow-x-hidden">
                <Navbar />
                <div className="pt-20 pb-20">
                  <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<Products />} />
                    <Route path="orders" element={<Orders />} />
                  </Routes>
                </div>
                <BottomNav />
              </div>
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
