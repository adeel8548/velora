import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../store/authSlice";
import { useNavigate, Link } from "react-router-dom";
import Logo from "./Logo";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/25 disabled:opacity-60";

const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";

function SectionTitle({ icon, title }) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-sm">
        {icon}
      </span>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    </div>
  );
}

export default function SignupForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    country: "Pakistan",
    postalCode: "",
    avatarUrl: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const isLoading = submitting || auth.status === "loading";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    const required = [
      "name",
      "email",
      "password",
      "confirm",
      "phone",
      "addressLine",
      "city",
      "state",
    ];
    for (const field of required) {
      if (!form[field]?.trim()) {
        setLocalError("Please fill all required fields marked with *");
        return;
      }
    }

    if (form.password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirm) {
      setLocalError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const result = await dispatch(
        registerUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
          addressLine: form.addressLine.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          country: form.country.trim() || "Pakistan",
          postalCode: form.postalCode.trim(),
          avatarUrl: form.avatarUrl.trim(),
        }),
      ).unwrap();

      if (result.needsEmailConfirm) {
        alert("Account created! Check your email to confirm, then login.");
        navigate("/login");
      } else {
        navigate(result.user?.role === "admin" ? "/admin" : "/");
      }
    } catch (err) {
      setLocalError(typeof err === "string" ? err : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] px-4 py-12">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50/80 via-white to-slate-50" />
      </div>

      <div className="relative mx-auto w-full max-w-2xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur-sm">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-10 text-center">
            <div className="mb-4 flex justify-center">
              <Logo
                showTagline
                className="flex-col items-center [&_span]:text-white [&_span:last-child]:text-amber-400"
              />
            </div>
            <h1 className="text-2xl font-bold text-white">Join Velora</h1>
            <p className="mt-2 text-sm text-slate-400">
              Create your account and start shopping premium fashion
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {localError && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <span className="text-lg leading-none">⚠️</span>
                <p>{localError}</p>
              </div>
            )}

            <form onSubmit={submit} className="space-y-8">
              {/* Personal */}
              <section>
                <SectionTitle icon="👤" title="Personal Details" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className={labelClass}>
                      Full Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      className={inputClass}
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      className={inputClass}
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelClass}>
                      Phone *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      className={inputClass}
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+92 300 1234567"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="avatarUrl" className={labelClass}>
                      Profile Photo URL{" "}
                      <span className="font-normal normal-case text-slate-400">
                        (optional)
                      </span>
                    </label>
                    <input
                      id="avatarUrl"
                      type="url"
                      name="avatarUrl"
                      className={inputClass}
                      value={form.avatarUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/photo.jpg"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </section>

              {/* Password */}
              <section>
                <SectionTitle icon="🔒" title="Security" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="password" className={labelClass}>
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        className={`${inputClass} pr-11`}
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Min. 6 characters"
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirm" className={labelClass}>
                      Confirm Password *
                    </label>
                    <input
                      id="confirm"
                      type={showPassword ? "text" : "password"}
                      name="confirm"
                      className={inputClass}
                      value={form.confirm}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Address */}
              <section>
                <SectionTitle icon="📍" title="Delivery Address" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="addressLine" className={labelClass}>
                      Street Address *
                    </label>
                    <input
                      id="addressLine"
                      type="text"
                      name="addressLine"
                      className={inputClass}
                      value={form.addressLine}
                      onChange={handleChange}
                      placeholder="House no, street, area"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className={labelClass}>
                      City *
                    </label>
                    <input
                      id="city"
                      type="text"
                      name="city"
                      className={inputClass}
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Karachi"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className={labelClass}>
                      State / Province *
                    </label>
                    <input
                      id="state"
                      type="text"
                      name="state"
                      className={inputClass}
                      value={form.state}
                      onChange={handleChange}
                      placeholder="Sindh"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className={labelClass}>
                      Country
                    </label>
                    <input
                      id="country"
                      type="text"
                      name="country"
                      className={inputClass}
                      value={form.country}
                      onChange={handleChange}
                      placeholder="Pakistan"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label htmlFor="postalCode" className={labelClass}>
                      Postal Code
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      name="postalCode"
                      className={inputClass}
                      value={form.postalCode}
                      onChange={handleChange}
                      placeholder="75500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </section>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:shadow-xl hover:shadow-amber-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </span>
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-amber-600 transition hover:text-amber-700"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6 text-center">
              <Link
                to="/"
                className="text-xs font-medium text-slate-400 transition hover:text-slate-600"
              >
                ← Continue browsing as guest
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Your profile is saved securely with Supabase
        </p>
      </div>
    </div>
  );
}
