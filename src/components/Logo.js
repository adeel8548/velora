import React from "react";
import { Link } from "react-router-dom";

export default function Logo({ className = "", showTagline = false }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 group ${className}`}>
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 shadow-lg shadow-amber-500/25 transition group-hover:shadow-amber-500/40">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path
            d="M16 4L26 12L16 28L6 12L16 4Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M16 8L22 12L16 22L10 12L16 8Z"
            fill="url(#veloraGrad)"
          />
          <defs>
            <linearGradient id="veloraGrad" x1="10" y1="8" x2="22" y2="22">
              <stop stopColor="#FDE68A" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="leading-tight">
        <span className="block text-xl font-bold tracking-tight text-slate-900">
          Velora
        </span>
        {showTagline && (
          <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-amber-600">
            Luxury Redefined
          </span>
        )}
      </div>
    </Link>
  );
}
