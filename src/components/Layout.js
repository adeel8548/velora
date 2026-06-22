import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import UpcomingSalesBanner from "./UpcomingSalesBanner";

export default function Layout() {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const isAdminLogin = location.pathname === "/admin/login";
  const isAdminPortal =
    user?.role === "admin" &&
    location.pathname.startsWith("/admin") &&
    !isAdminLogin;

  if (isAdminPortal) {
    return (
      <div className="min-h-screen w-full bg-slate-100">
        <Sidebar />
        <div className="min-h-screen w-full pl-64">
          <main className="min-h-screen w-full min-w-0 overflow-x-auto">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-white">
      <div className="flex min-h-screen w-full flex-col bg-slate-50">
        <Header />
        <UpcomingSalesBanner />
        <main className="flex-1 px-4 py-8 md:px-2">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
