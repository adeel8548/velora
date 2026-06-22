import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUserOrders } from "../store/orderSlice";

export default function Orders() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const orders = useSelector((state) => state.orders.items);
  const orderStatus = useSelector((state) => state.orders.status);
  const [localOrders, setLocalOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await dispatch(fetchUserOrders(user.id || user._id)).unwrap();
      setLocalOrders(result || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLocalOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "confirmed":
        return "✓";
      case "shipped":
        return "📦";
      case "delivered":
        return "✓✓";
      case "cancelled":
        return "✗";
      default:
        return "•";
    }
  };

  const filteredOrders = localOrders.filter((order) => {
    if (filter === "all") return true;
    return order.status === filter;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900">Please login</h2>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block">
            <div className="animate-spin text-5xl">⏳</div>
            <p className="mt-4 text-gray-600 font-semibold">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (localOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="text-7xl mb-4">📦</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            No Orders Yet
          </h2>
          <p className="text-gray-600 mb-8">
            You haven't placed any orders yet. Start shopping now!
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-block px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">
            You have {localOrders.length} order{localOrders.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8 flex flex-wrap gap-2 bg-white rounded-lg shadow-md p-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("confirmed")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === "confirmed"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setFilter("shipped")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === "shipped"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Shipped
          </button>
          <button
            onClick={() => setFilter("delivered")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === "delivered"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Delivered
          </button>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
            >
              {/* Order Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Order ID</p>
                    <p className="text-gray-900 font-bold">{order._id?.substring(0, 12)}...</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Order Date</p>
                    <p className="text-gray-900 font-bold">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)} {order.status?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Total Amount</p>
                    <p className="text-indigo-600 font-bold text-lg">
                      ${order.totalAmount?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Items</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <p className="text-gray-900 font-semibold line-clamp-2 mb-2">
                        {item.productName || item.product}
                      </p>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600 text-sm">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-indigo-600 font-bold">
                          ${item.price?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Total: ${(item.price * item.quantity)?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="bg-gray-50 border-t border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Shipping Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm">
                        {order.shippingAddress.firstName}{" "}
                        {order.shippingAddress.lastName}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {order.shippingAddress.address}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                        {order.shippingAddress.zipCode}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {order.shippingAddress.country}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Contact</p>
                      <p className="text-gray-900">
                        {order.shippingAddress.email}
                      </p>
                      <p className="text-gray-900">
                        {order.shippingAddress.phone}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="border-t border-gray-200 p-6 bg-white">
                <div className="flex justify-end gap-8 max-w-md ml-auto">
                  <div>
                    <p className="text-gray-600 text-sm">Subtotal</p>
                    <p className="text-gray-900 font-bold">
                      ${(
                        (order.totalAmount -
                          (order.taxAmount || 0) -
                          (order.shippingAmount || 0)) / 1
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Tax</p>
                    <p className="text-gray-900 font-bold">
                      ${(order.taxAmount || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Shipping</p>
                    <p className="text-gray-900 font-bold">
                      ${(order.shippingAmount || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 text-sm">Total</p>
                    <p className="text-indigo-600 font-bold text-xl">
                      ${order.totalAmount?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
                >
                  Continue Shopping
                </button>
                <button className="flex-1 px-4 py-2 border-2 border-indigo-600 text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition">
                  Track Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
