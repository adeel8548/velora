import React from "react";
import BannerImage from "../assets/imgs/4182835_1255.jpg";
export default function SpecialOfferBanner() {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto rounded-2xl overflow-hidden relative">
        <div className="grid md:grid-cols-2 items-center">
          <div className="p-10 bg-gradient-to-r from-white/70 to-white/40 glass">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">
              Limited Time: Premium Headphones
            </h3>
            <p className="text-gray-600 mb-6">
              Get the new StudioPro headphones with immersive sound and active
              noise cancellation. 20% off for a limited time.
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-full font-semibold hover:shadow-lg transition">
              Shop Offer
            </button>
          </div>
          <div className="p-6 flex items-center justify-center bg-gradient-to-r from-slate-50 to-white">
            <div className="w-full h-96 soft-rounded overflow-hidden shadow-2xl">
              <img
                src={BannerImage}
                alt="offer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
