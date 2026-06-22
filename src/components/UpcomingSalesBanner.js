import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchUpcomingPromotions,
  formatUpcomingLabel,
} from "../services/promotionService";

export default function UpcomingSalesBanner() {
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    const load = () => {
      fetchUpcomingPromotions()
        .then(setUpcoming)
        .catch(() => setUpcoming([]));
    };

    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  if (upcoming.length === 0) return null;

  const primary = upcoming[0];

  return (
    <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-4 py-2.5 text-center text-sm">
        <span className="text-base" aria-hidden="true">
          🏷️
        </span>
        <p className="font-semibold text-amber-900">
          {formatUpcomingLabel(primary)}
        </p>
        {upcoming.length > 1 && (
          <span className="text-xs text-amber-700">
            +{upcoming.length - 1} more upcoming
          </span>
        )}
        <Link
          to="/shop"
          className="ml-1 text-xs font-bold text-amber-700 underline hover:text-amber-900"
        >
          Shop now
        </Link>
      </div>

      {upcoming.length > 1 && (
        <div className="mx-auto max-w-7xl px-4 pb-2">
          <div className="flex flex-wrap justify-center gap-2">
            {upcoming.slice(1).map((p) => (
              <span
                key={p.id}
                className="rounded-full bg-white/80 px-3 py-0.5 text-[11px] font-medium text-amber-800 shadow-sm"
              >
                {formatUpcomingLabel(p)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
