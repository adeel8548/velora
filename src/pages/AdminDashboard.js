import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PageLoader from "../components/PageLoader";

const AdminDashboardHome = lazy(() => import("../components/admin/AdminDashboardHome"));
const AdminProducts = lazy(() => import("../components/admin/AdminProducts"));
const AdminCategories = lazy(() => import("../components/admin/AdminCategories"));
const AdminSubcategories = lazy(() => import("../components/admin/AdminSubcategories"));
const AdminUsers = lazy(() => import("../components/admin/AdminUsers"));
const AdminOrders = lazy(() => import("../components/admin/AdminOrders"));
const AdminSales = lazy(() => import("../components/admin/AdminSales"));
const AdminSalesReport = lazy(() => import("../components/admin/AdminSalesReport"));

export default function AdminDashboard() {
  return (
    <div className="w-full min-h-screen">
      <Suspense fallback={<PageLoader fullScreen={false} />}>
        <Routes>
          <Route index element={<AdminDashboardHome />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="subcategories" element={<AdminSubcategories />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="sales" element={<AdminSales />} />
          <Route path="sales-report" element={<AdminSalesReport />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
