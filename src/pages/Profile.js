import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logoutUser, setUser } from "../store/authSlice";
import { getCurrentUserProfile } from "../services/authService";
import ProfileForm from "../components/ProfileForm";

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUserState] = useState(authUser);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }
    loadProfile();
  }, [authUser, navigate]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await getCurrentUserProfile();
      if (!profile) {
        setError("Profile not found — please complete your profile below.");
        setEditing(true);
        setUserState(authUser);
        return;
      }
      setUserState(profile);
      dispatch(setUser(profile));
    } catch (err) {
      setError(err.message || "Failed to load profile");
      setEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaved = (updated) => {
    setUserState(updated);
    dispatch(setUser(updated));
    setEditing(false);
    setError(null);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/");
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center py-16">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="mt-4 text-slate-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 mt-1">
            {user?.role === "admin" ? "Admin account" : "Customer account"} · Supabase profiles
          </p>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-5 py-2.5 bg-amber-500 text-slate-900 rounded-xl font-semibold hover:bg-amber-400"
            >
              Edit Profile
            </button>
          )}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="px-5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-white"
            >
              Admin Portal
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {error && !editing && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header card */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-6 sm:p-8 text-white">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-amber-500/30 border-2 border-amber-400/50 shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.name || "Complete your profile"}</h2>
              <p className="text-slate-300 text-sm mt-0.5">{user?.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold uppercase">
                  {user?.role || "user"}
                </span>
                <span className="px-2.5 py-0.5 bg-white/10 rounded-full text-xs">
                  Joined {formatDate(user?.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {editing ? (
            <>
              {error && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
                  {error} — fill all fields and save.
                </div>
              )}
              <ProfileForm
                profile={user}
                onSaved={handleSaved}
                onCancel={() => setEditing(false)}
              />
            </>
          ) : (
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 border-b pb-2">Personal</h3>
                {[
                  ["Full Name", user?.name],
                  ["Email", user?.email],
                  ["Phone", user?.phone],
                  ["Role", user?.role],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400 uppercase font-semibold">{label}</p>
                    <p className="text-slate-800 capitalize">{val || "—"}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 border-b pb-2">Address</h3>
                {[
                  ["Street", user?.addressLine],
                  ["City", user?.city],
                  ["State", user?.state],
                  ["Country", user?.country],
                  ["Postal Code", user?.postalCode],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400 uppercase font-semibold">{label}</p>
                    <p className="text-slate-800">{val || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
