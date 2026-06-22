import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { adminLogin } from "../store/authSlice";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const isLoading = submitting || auth.status === "loading";

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter email and password");
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(adminLogin({ email: email.trim(), password })).unwrap();
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(typeof err === "string" ? err : "Admin login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded shadow p-6">
      <h2 className="text-2xl font-semibold mb-4">Admin Login</h2>
      {error && (
        <div className="mb-3 p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <input
          className="w-full border rounded px-3 py-2 disabled:opacity-60"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          disabled={isLoading}
          required
        />
        <input
          className="w-full border rounded px-3 py-2 disabled:opacity-60"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          disabled={isLoading}
          required
        />
        <button
          className="w-full bg-red-600 text-white py-2 rounded disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login as Admin"}
        </button>
      </form>
    </div>
  );
}
