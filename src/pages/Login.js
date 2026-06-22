import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../store/authSlice";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Logo from "../components/Logo";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 pl-11 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/25 disabled:opacity-60";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const isLoading = submitting || auth.status === "loading";

  const submit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError("Please enter email and password");
      return;
    }

    setSubmitting(true);
    try {
      const data = await dispatch(
        loginUser({ email: email.trim(), password }),
      ).unwrap();

      if (data?.user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setLocalError(typeof err === "string" ? err : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50/80 via-white to-slate-50" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur-sm">
          {/* Header strip */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-10 text-center">
            <div className="mb-4 flex justify-center">
              <Logo showTagline className="flex-col items-center [&_span]:text-white [&_span:last-child]:text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-400">
              Sign in to continue shopping premium fashion
            </p>
          </div>

          <div className="p-8">
            {auth.user && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <span className="text-lg leading-none">ℹ️</span>
                <p>
                  Logged in as <strong>{auth.user.email}</strong>. Visit{" "}
                  <Link to="/profile" className="font-semibold underline">
                    profile
                  </Link>{" "}
                  to switch accounts.
                </p>
              </div>
            )}

            {localError && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <span className="text-lg leading-none">⚠️</span>
                <p>{localError}</p>
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    className={`${inputClass} pr-11`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
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
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858 3.03a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:shadow-xl hover:shadow-amber-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </span>
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-amber-600 transition hover:text-amber-700"
                >
                  Create one free
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
          Secure login powered by Supabase
        </p>
      </div>
    </div>
  );
}
