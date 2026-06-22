import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../store/authSlice";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  const adminItems = [
    { label: "Dashboard", icon: "📊", path: "/admin" },
    { label: "Products", icon: "📦", path: "/admin/products" },
    { label: "Categories", icon: "📂", path: "/admin/categories" },
    { label: "Subcategories", icon: "📁", path: "/admin/subcategories" },
    { label: "Sale Offers", icon: "🏷️", path: "/admin/sales" },
    { label: "Sales Report", icon: "💰", path: "/admin/sales-report" },
    { label: "Orders", icon: "📋", path: "/admin/orders" },
    { label: "Users", icon: "👥", path: "/admin/users" },
  ];

  return (
    <>
      <aside
        className={`${
          isOpen ? "w-64" : "w-20"
        } fixed left-0 top-0 z-50 h-screen bg-slate-900 text-slate-200 transition-all duration-300 flex flex-col border-r border-slate-800`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          {isOpen ? (
            <Link to="/admin">
              <span className="text-lg font-bold text-white">Velora</span>
              <span className="block text-[10px] text-amber-400 uppercase tracking-widest">Admin Portal</span>
            </Link>
          ) : (
            <span className="text-amber-400 font-bold mx-auto">V</span>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            {isOpen ? "◀" : "▶"}
          </button>
        </div>

        {user && isOpen && (
          <div className="p-4 border-b border-slate-800">
            <p className="text-sm font-semibold text-white truncate">{user.name || user.email}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <span className="inline-block mt-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full uppercase">
              Admin
            </span>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {adminItems.map((item) => {
            const active =
              item.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-amber-500 text-slate-900"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                title={!isOpen ? item.label : ""}
              >
                <span className="text-lg">{item.icon}</span>
                {isOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <span>🏪</span>
            {isOpen && <span>View Store</span>}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10"
          >
            <span>🚪</span>
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
