import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Layout from "./components/Layout";
import PageLoader from "./components/PageLoader";
import ProductList from "./pages/ProductList";
import AdminDashboard from "./pages/AdminDashboard";
import { initializeAuth, setUser, forceInitialized } from "./store/authSlice";
import { syncProfileInBackground } from "./services/authService";

const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));

function ProtectedAdminRoute({ children }) {
  const user = useSelector((state) => state.auth.user);

  if (!user || user.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function AppBootstrap({ children }) {
  const dispatch = useDispatch();
  const initialized = useSelector((state) => state.auth.initialized);

  useEffect(() => {
    if (!initialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, initialized]);

  useEffect(() => {
    if (initialized) return undefined;
    const timer = setTimeout(() => dispatch(forceInitialized()), 10000);
    return () => clearTimeout(timer);
  }, [dispatch, initialized]);

  useEffect(() => {
    if (!initialized) return;
    syncProfileInBackground()
      .then((user) => {
        if (user) dispatch(setUser(user));
      })
      .catch(() => {});
  }, [dispatch, initialized]);

  if (!initialized) {
    return <PageLoader />;
  }

  return children;
}

export default function App() {
  return (
    <AppBootstrap>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ProductList />} />
            <Route path="shop" element={<ProductList />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="orders" element={<Orders />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin/login" element={<AdminLogin />} />
            <Route
              path="admin/*"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </AppBootstrap>
  );
}
