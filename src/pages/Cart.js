import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  removeItem,
  clearCart,
  increaseQuantity,
  decreaseQuantity,
} from "../store/cartSlice";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import ProductImage from "../components/ProductImage";
import { formatPKR } from "../lib/format";
import { cartItemHasSale } from "../lib/mappers";
import SalePriceHighlight from "../components/SalePriceHighlight";

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector((state) => state.cart.items);
  const user = useSelector((state) => state.auth.user);

  const totalSavings = items.reduce((sum, item) => {
    if (!cartItemHasSale(item)) return sum;
    const orig = Number(item.originalPrice ?? item.price);
    return sum + (orig - item.price) * item.quantity;
  }, 0);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const subtotal = total;
  const tax = (subtotal * 0.1).toFixed(2);
  const shipping = subtotal > 5000 ? 0 : 250;
  const finalTotal = (
    parseFloat(subtotal) +
    parseFloat(tax) +
    parseFloat(shipping)
  ).toFixed(2);

  const handleRemoveItem = (productId) => {
    dispatch(removeItem(productId));
    Swal.fire({
      title: "Removed!",
      text: "Item removed from cart",
      icon: "success",
      timer: 1000,
      showConfirmButton: false,
    });
  };

  const handleCheckout = () => {
    if (!user) {
      Swal.fire({
        title: "Login Required",
        text: "Please login to proceed with checkout",
        icon: "warning",
        confirmButtonText: "Go to Login",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login", { state: { from: "/checkout" } });
        }
      });
      return;
    }
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="text-7xl mb-6">🛒</div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Your Cart is Empty
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Add some amazing products to your cart and start shopping!
          </p>
          <Link
            to="/"
            className="inline-block px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition transform hover:scale-105"
          >
            🛍️ Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">
            You have {items.length} item{items.length !== 1 ? "s" : ""} in your cart
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item, idx) => {
                const onSale = cartItemHasSale(item);
                return (
                <div
                  key={idx}
                  className={`bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden border ${
                    onSale ? "border-amber-400 ring-2 ring-amber-100" : "border-gray-100"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
                    {/* Product Image */}
                    {item.image && (
                      <Link
                        to={`/product/${item.product}`}
                        className="flex-shrink-0"
                      >
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          productId={item.product}
                          className="w-32 h-32 object-cover rounded-lg hover:opacity-80 transition"
                        />
                      </Link>
                    )}

                    {/* Product Info */}
                    <div className="flex-1">
                      <Link
                        to={`/product/${item.product}`}
                        className="text-xl font-bold text-gray-900 hover:text-indigo-600 mb-2 block"
                      >
                        {item.name}
                      </Link>
                      {onSale ? (
                        <SalePriceHighlight
                          salePrice={item.price}
                          originalPrice={item.originalPrice}
                          discountPercent={item.discountPercent}
                          size="md"
                          className="mb-4"
                        />
                      ) : (
                        <p className="text-2xl font-bold text-amber-600 mb-4">
                          {formatPKR(item.price)}
                        </p>
                      )}

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4 bg-gray-100 p-2 rounded-lg w-fit">
                        <button
                          onClick={() =>
                            dispatch(decreaseQuantity(item.product))
                          }
                          className="bg-white hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded font-bold transition"
                          title="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="px-6 py-2 font-bold text-center min-w-16 text-lg">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            dispatch(increaseQuantity(item.product))
                          }
                          className="bg-white hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded font-bold transition"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price and Actions */}
                    <div className="text-right">
                      <div className={`text-3xl font-bold mb-4 ${onSale ? "text-emerald-700" : "text-amber-600"}`}>
                        {formatPKR(item.price * item.quantity)}
                      </div>
                      {onSale && (
                        <p className="text-xs font-bold text-amber-700 mb-2">
                          🏷️ Sale applied
                        </p>
                      )}
                      <button
                        onClick={() => handleRemoveItem(item.product)}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>

            {/* Continue Shopping */}
            <Link
              to="/"
              className="mt-8 inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-700 transition"
            >
              ← Continue Shopping
            </Link>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-blue-50 via-indigo-50 to-purple-50 rounded-lg shadow-lg p-8 sticky top-24 border border-indigo-100">
              <h3 className="text-2xl font-bold mb-8 text-gray-900">
                Order Summary
              </h3>

              {/* Breakdown */}
              <div className="space-y-4 mb-6 pb-6 border-b-2 border-indigo-200">
                {totalSavings > 0 && (
                  <div className="flex justify-between text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    <span className="font-medium">🎉 Sale Savings:</span>
                    <span className="font-bold">− {formatPKR(totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-semibold text-gray-900">
                    {formatPKR(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">Tax (10%):</span>
                  <span className="font-semibold text-gray-900">
                    {formatPKR(tax)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">Shipping:</span>
                  {shipping === 0 ? (
                    <span className="font-semibold text-green-600">FREE ✓</span>
                  ) : (
                    <span className="font-semibold text-gray-900">
                      {formatPKR(shipping)}
                    </span>
                  )}
                </div>
                {shipping === 0 && (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 mt-4">
                    <p className="text-sm text-green-700 font-semibold">
                      🎉 Free shipping applied!
                    </p>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mb-8 text-xl bg-white rounded-lg p-4">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="text-3xl font-bold text-indigo-600">
                  {formatPKR(finalTotal)}
                </span>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-lg hover:shadow-lg transition font-bold text-lg transform hover:scale-105"
                >
                  💳 Proceed to Checkout
                </button>
                <button
                  onClick={() => {
                    dispatch(clearCart());
                    Swal.fire({
                      title: "Cart Cleared!",
                      text: "Your cart has been emptied",
                      icon: "info",
                      timer: 1500,
                      showConfirmButton: false,
                    });
                  }}
                  className="w-full bg-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
                >
                  Clear Cart
                </button>
              </div>

              {/* Trust badges */}
              <div className="mt-8 pt-8 border-t-2 border-indigo-200 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-lg">✓</span>
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-lg">✓</span>
                  <span>30-day return policy</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-lg">✓</span>
                  <span>Money-back guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
