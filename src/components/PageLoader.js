import React from "react";

export default function PageLoader({ label = "Velora", fullScreen = true }) {
  return (
    <div
      className={`flex items-center justify-center bg-slate-50 ${
        fullScreen ? "min-h-screen w-full" : "py-20 w-full"
      }`}
    >
      <div className="relative flex h-28 w-28 items-center justify-center">
        <div
          className="absolute inset-0 animate-spin rounded-full border-[3px] border-amber-500/20 border-t-amber-500"
          aria-hidden="true"
        />
        <span className="relative z-10 text-lg font-bold tracking-tight text-slate-900">
          {label}
        </span>
      </div>
    </div>
  );
}
