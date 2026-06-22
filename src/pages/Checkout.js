import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCart } from "../store/cartSlice";
import { createOrder } from "../store/orderSlice";
import Swal from "sweetalert2";
import { cartItemHasSale } from "../lib/mappers";
import { formatPKR } from "../lib/format";
import SalePriceHighlight from "../components/SalePriceHighlight";

export default function Checkout() {
  const { user } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    zipCode: user?.zipCode || "",
    country: user?.country || "United States",
    cardNumber: "",
    cardExpiry: "",
    cardCVC: "",
  });

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalSavings = cartItems.reduce((sum, item) => {
    if (!cartItemHasSale(item)) return sum;
    return sum + (Number(item.originalPrice) - item.price) * item.quantity;
  }, 0);
  const tax = cartTotal * 0.1;
  const shipping = cartTotal > 5000 ? 0 : 250;
  const finalTotal = cartTotal + tax + shipping;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const required = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "zipCode",
      "cardNumber",
      "cardExpiry",
      "cardCVC",
    ];

    for (let field of required) {
      if (!formData[field]) {
        Swal.fire({
          title: "Missing Information",
          text: `Please fill in all required fields`,
          icon: "warning",
        });
        return false;
      }
    }

    // Basic email validation
    if (!formData.email.includes("@")) {
      Swal.fire({
        title: "Invalid Email",
        text: "Please enter a valid email address",
        icon: "warning",
      });
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const order = await dispatch(
        createOrder({
          userId: user.id || user._id,
          cartItems,
          shipping: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          },
          totals: {
            subtotal: cartTotal,
            tax,
            shipping,
            total: finalTotal,
          },
          paymentMethod: "card",
          cardNumber: formData.cardNumber,
        }),
      ).unwrap();

      dispatch(clearCart());

      Swal.fire({
        title: "Order Placed Successfully!",
        text: `Order #${order.order_number || order._id?.slice(0, 8)}`,
        icon: "success",
        confirmButtonText: "View Orders",
      }).then((result) => {
        if (result.isConfirmed) navigate("/orders");
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error || "Failed to place order",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Guard clauses
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8 text-center border border-indigo-200">
          <div className="text-7xl mb-4">🔒</div>
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            Login Required
          </h2>
          <p className="mb-8 text-gray-700 text-lg">
            You must be logged in to complete your purchase.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/login", { state: { from: "/checkout" } })}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition font-bold text-center"
            >
              Login to Continue
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-lg p-8 text-center border border-orange-200">
          <div className="text-7xl mb-4">🛒</div>
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            Your Cart is Empty
          </h2>
          <p className="mb-8 text-gray-700 text-lg">
            Add items to your cart before checking out.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition font-bold"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Checkout</h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Checkout Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
                {/* Shipping Information */}
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                    <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center">
                      1
                    </span>
                    Shipping Address
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name *"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="col-span-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition"
                      required
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name *"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="col-span-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition"
                      required
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email *"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="col-span-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition"
                      required
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number *"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="col-span-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition"
                      required
                    />
                    <input
                      type="text"
                      name="address"
                      placeholder="Street Address *"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="col-span-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition"
                      required
                    />
                    <input
                      type="text"
                      name="city"
                      placeholder="City *"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="col-span-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition"
                      required
                    />
                    <input
                      type="text"
                      name="state"
                      placeholder="State/Province *"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="col-span-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition"
                      required
                    />
                    <input
                      type="text"
                      name="zipCode"
                      placeholder="ZIP Code *"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="col-span-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition"
                      required
                    />
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="col-span-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition"
                      required
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="border-t pt-8">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                    <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center">
                      2
                    </span>
                    Payment Method
                  </h2>

                  <div className="space-y-4">
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="Card Number (16 digits) *"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      maxLength="16"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition"
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="cardExpiry"
                        placeholder="MM/YY *"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        maxLength="5"
                        className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition"
                        required
                      />
                      <input
                        type="text"
                        name="cardCVC"
                        placeholder="CVC *"
                        value={formData.cardCVC}
                        onChange={handleInputChange}
                        maxLength="4"
                        className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-b from-blue-50 via-indigo-50 to-purple-50 rounded-lg shadow-lg p-8 sticky top-24 border border-indigo-100">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">
                  Order Summary
                </h3>

                {/* Items */}
                <div className="mb-6 pb-6 border-b-2 border-indigo-200 max-h-64 overflow-y-auto">
                  {cartItems.map((item, idx) => {
                    const onSale = cartItemHasSale(item);
                    return (
                    <div
                      key={idx}
                      className={`flex justify-between items-start mb-4 text-sm rounded-xl p-3 ${
                        onSale ? "bg-amber-50 border border-amber-200" : ""
                      }`}
                    >
                      <div className="flex-1 pr-2">
                        <p className="font-semibold text-gray-900 line-clamp-2">
                          {item.name}
                        </p>
                        <p className="text-gray-600">Qty: {item.quantity}</p>
                        {onSale && (
                          <SalePriceHighlight
                            salePrice={item.price}
                            originalPrice={item.originalPrice}
                            discountPercent={item.discountPercent}
                            size="sm"
                            variant="card"
                            className="mt-2"
                          />
                        )}
                      </div>
                      <p className={`font-bold flex-shrink-0 ml-2 ${onSale ? "text-emerald-700" : "text-indigo-600"}`}>
                        {formatPKR(item.price * item.quantity)}
                      </p>
                    </div>
                  );
                  })}
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-3 pb-6 border-b-2 border-indigo-200">
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-amber-700 bg-amber-50 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium">Sale Savings</span>
                      <span className="font-bold">− {formatPKR(totalSavings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-semibold">{formatPKR(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">Tax (10%):</span>
                    <span className="font-semibold">{formatPKR(tax)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">Shipping:</span>
                    {shipping === 0 ? (
                      <span className="font-semibold text-green-600">FREE ✓</span>
                    ) : (
                      <span className="font-semibold">{formatPKR(shipping)}</span>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-8 text-xl bg-white rounded-lg p-4 mt-6">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="text-3xl font-bold text-indigo-600">
                    {formatPKR(finalTotal)}
                  </span>
                </div>

                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg"
                  }`}
                >
                  {loading ? "Processing..." : "💳 Place Order"}
                </button>

                {/* Security badges */}
                <div className="mt-8 pt-8 border-t-2 border-indigo-200 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-lg">🔒</span>
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-lg">✓</span>
                    <span>30-day returns</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-lg">✓</span>
                    <span>Money-back guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
