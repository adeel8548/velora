import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo className="[&_span]:text-white [&_.text-xl]:text-white" />
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Velora — premium fashion for Men, Women & Kids. Watches, shoes,
            glasses, shirts, shalwar kameez and more.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
            Shop
          </h4>
          <ul className="space-y-2.5 text-sm">
            {["Men", "Women", "Kids"].map((cat) => (
              <li key={cat}>
                <Link
                  to={`/shop?category=${cat}`}
                  className="transition hover:text-amber-400"
                >
                  {cat}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/shop" className="transition hover:text-amber-400">
                All Products
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
            Help
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>Shipping & Delivery</li>
            <li>Returns & Exchanges</li>
            <li>Size Guide</li>
            <li>Contact Us</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
            Newsletter
          </h4>
          <p className="mb-4 text-sm text-slate-400">
            Get 15% off your first order.
          </p>
          <div className="flex">
            <input
              className="flex-1 rounded-l-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="Email address"
            />
            <button
              type="button"
              className="rounded-r-lg bg-amber-500 px-4 text-sm font-bold text-slate-900 transition hover:bg-amber-400"
            >
              Join
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-slate-500 sm:flex-row">
          <span>© {new Date().getFullYear()} Velora. All rights reserved.</span>
          <span>Premium Fashion · Pakistan</span>
        </div>
      </div>
    </footer>
  );
}
