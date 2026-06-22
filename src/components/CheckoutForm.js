import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "../store/cartSlice";
import api from "../api";
import { formatPKR } from "../lib/format";

export default function CheckoutForm({ clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [contact, setContact] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: user?.city || "",
    addressLine: user?.addressLine || "",
  });

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe not loaded");
      setLoading(false);
      return;
    }

    try {
      // Confirm payment with card
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: user?.name || "Customer",
            email: user?.email || "customer@example.com",
          },
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent) {
        if (result.paymentIntent.status === "succeeded") {
          setSuccess(true);
          // Create order in backend
          try {
            // POST to /orders (backend expects POST /api/orders with body)
            await api.post("/orders", {
              items: cartItems,
              address: {
                addressLine: contact.addressLine,
                city: contact.city,
              },
              buyerName: contact.name,
              buyerEmail: contact.email,
              buyerPhone: contact.phone,
              buyerCity: contact.city,
              total: total,
              paymentIntentId: result.paymentIntent.id,
              status: "completed",
            });
            dispatch(clearCart());
            setTimeout(() => {
              navigate("/");
              alert("Payment successful! Order created.");
            }, 2000);
          } catch (err) {
            console.error("Error creating order:", err);
          }
        }
      }
    } catch (err) {
      setError(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-green-600 font-semibold">
        ✓ Payment successful! Redirecting...
      </div>
    );
  }

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            value={contact.name}
            onChange={(e) => setContact({ ...contact, name: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              value={contact.phone}
              onChange={(e) =>
                setContact({ ...contact, phone: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              value={contact.city}
              onChange={(e) => setContact({ ...contact, city: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input
            value={contact.addressLine}
            onChange={(e) =>
              setContact({ ...contact, addressLine: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Card Details</label>
        <div className="border rounded p-3">
          <CardElement options={{ hidePostalCode: true }} />
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded">
        <div className="flex justify-between text-sm mb-2">
          <span>Total Amount:</span>
          <span className="font-bold text-indigo-600">{formatPKR(total)}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 font-semibold disabled:bg-gray-400"
        disabled={!stripe || loading || !clientSecret}
      >
        {loading ? "Processing..." : `Pay ${formatPKR(total)}`}
      </button>
    </form>
  );
}
