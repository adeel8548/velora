import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../store/authSlice";
import Logo from "./Logo";
import { DEMO_CATEGORIES } from "../data/demoProducts";

export default function Header() {
  const cartItems = useSelector((state) => state.cart.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    dispatch(logoutUser());
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/shop");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur-lg">
      {/* Top bar */}
      <div className="hidden border-b border-slate-100 bg-slate-900 px-4 py-2 text-center text-xs text-slate-300 sm:block">
        Free delivery on orders over Rs. 5,000 &nbsp;|&nbsp; New arrivals every
        week &nbsp;|&nbsp; Easy 30-day returns
      </div>

      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center gap-4 lg:gap-8">
          <Logo showTagline />

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              to="/shop"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Shop All
            </Link>
            {DEMO_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/shop?category=${cat}`}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {cat}
              </Link>
            ))}
            <Link
              to="/shop?sort=price-low"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
            >
              Sale
            </Link>
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden flex-1 md:block">
            <div className="relative mx-auto max-w-md">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search watches, shoes, shirts..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-5 pr-24 text-sm transition focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 rounded-full bg-slate-900 px-5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Search
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <Link
                  to="/orders"
                  className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
                >
                  Orders
                </Link>
                <Link
                  to={user.role === "admin" ? "/admin" : "/profile"}
                  className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
                >
                  {user.role === "admin" ? "Admin" : "Account"}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden text-sm font-medium text-red-500 hover:text-red-600 sm:block"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
              >
                Sign In
              </Link>
            )}

            <Link
              to="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:border-amber-300 hover:shadow-md"
              aria-label="Shopping cart"
            >
              <svg
                className="h-5 w-5 text-slate-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-amber-500/40">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 lg:hidden"
              aria-label="Toggle menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav className="mt-4 space-y-1 border-t border-slate-100 pt-4 lg:hidden">
            {DEMO_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/shop?category=${cat}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {cat}
              </Link>
            ))}
            <Link
              to="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Shop All
            </Link>
            {!user && (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-2.5 text-sm font-medium text-amber-600"
              >
                Sign In
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
