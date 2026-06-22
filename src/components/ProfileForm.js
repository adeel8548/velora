import React, { useState, useEffect } from "react";
import {
  profileToForm,
  updateProfile,
  uploadAvatar,
} from "../services/authService";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  phone: "",
  address_line: "",
  city: "",
  state: "",
  country: "Pakistan",
  postal_code: "",
  avatar_url: "",
  role: "user",
};

export default function ProfileForm({ profile, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (profile) {
      const f = profileToForm(profile);
      setForm(f);
      setAvatarPreview(f.avatar_url || "");
    }
  }, [profile]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let avatarUrl = form.avatar_url;

      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }

      const updated = await updateProfile({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        address_line: form.address_line.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim() || "Pakistan",
        postal_code: form.postal_code.trim(),
        avatar_url: avatarUrl,
      });

      setSuccess("Profile saved successfully!");
      onSaved?.(updated);
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400";

  return (
    <form onSubmit={submit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* Avatar */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          Profile Photo
        </h3>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-400">
                {form.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Upload avatar (avatar_url)
            </label>
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="text-sm" />
            <input
              type="url"
              name="avatar_url"
              value={form.avatar_url}
              onChange={handleChange}
              placeholder="Or paste image URL"
              className={`${inputClass} mt-2`}
            />
          </div>
        </div>
      </section>

      {/* Personal */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          Personal Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Full Name (full_name) *
            </label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Email (email)
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              readOnly
              className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Phone (phone) *
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="03XX XXXXXXX"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Role (role)
            </label>
            <input
              type="text"
              name="role"
              value={form.role}
              readOnly
              className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed capitalize`}
            />
          </div>
        </div>
      </section>

      {/* Address */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          Address
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Street Address (address_line) *
            </label>
            <input
              type="text"
              name="address_line"
              value={form.address_line}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                City (city) *
              </label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                State / Province (state) *
              </label>
              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Country (country)
              </label>
              <input
                type="text"
                name="country"
                value={form.country}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Postal Code (postal_code)
              </label>
              <input
                type="text"
                name="postal_code"
                value={form.postal_code}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
