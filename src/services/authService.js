import { supabase } from "../lib/supabase";
import { mapProfile } from "../lib/mappers";
import { withTimeout } from "../lib/async";

export function profileToForm(profile) {
  return {
    full_name: profile?.full_name || profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    address_line: profile?.address_line || profile?.addressLine || "",
    city: profile?.city || "",
    state: profile?.state || "",
    country: profile?.country || "Pakistan",
    postal_code: profile?.postal_code || profile?.postalCode || "",
    avatar_url: profile?.avatar_url || "",
    role: profile?.role || "user",
  };
}

function mergeProfileFields(existing, authUser) {
  const meta = authUser?.user_metadata || {};
  return {
    full_name:
      existing?.full_name ||
      meta.full_name ||
      meta.name ||
      "",
    phone: existing?.phone || meta.phone || "",
    address_line: existing?.address_line || meta.address_line || "",
    city: existing?.city || meta.city || "",
    state: existing?.state || meta.state || "",
    country: existing?.country || meta.country || "Pakistan",
    postal_code: existing?.postal_code || meta.postal_code || "",
    avatar_url: existing?.avatar_url || meta.avatar_url || "",
  };
}

function needsProfileSync(existing, merged) {
  if (!existing) return true;
  const keys = [
    "phone",
    "address_line",
    "city",
    "state",
    "country",
    "postal_code",
  ];
  return keys.some((key) => {
    const dbVal = existing[key];
    const mergedVal = merged[key];
    return (!dbVal || dbVal === "") && mergedVal && mergedVal !== "";
  });
}

export async function fetchProfileById(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function fetchProfileQuick(authUser) {
  try {
    const profile = await withTimeout(fetchProfileById(authUser.id), 5000, null);
    return mapProfile(profile, authUser);
  } catch {
    return mapProfile(null, authUser);
  }
}

/** Direct save to profiles table — primary method (no RPC dependency) */
export async function saveProfileDirect(fields) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Not authenticated");

  const row = {
    full_name: fields.full_name?.trim() || null,
    phone: fields.phone?.trim() || null,
    address_line: fields.address_line?.trim() || null,
    city: fields.city?.trim() || null,
    state: fields.state?.trim() || null,
    country: fields.country?.trim() || "Pakistan",
    postal_code: fields.postal_code?.trim() || null,
    avatar_url: fields.avatar_url?.trim() || null,
  };

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(row)
    .eq("id", user.id)
    .select()
    .maybeSingle();

  if (updateError) throw updateError;

  if (updated) return updated;

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      ...row,
      role: "user",
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return inserted;
}

/** Merge DB profile + auth metadata, save if anything was missing */
export async function ensureProfile(authUser) {
  const existing = await withTimeout(fetchProfileById(authUser.id), 5000, null);
  const merged = mergeProfileFields(existing, authUser);

  if (needsProfileSync(existing, merged) || !existing) {
    return withTimeout(saveProfileDirect(merged), 8000, existing || merged);
  }

  return existing;
}

export async function upsertProfile(fields) {
  return saveProfileDirect(fields);
}

export async function getCurrentUserProfile() {
  const {
    data: { user },
    error: authError,
  } = await withTimeout(supabase.auth.getUser(), 5000, { data: { user: null }, error: null });

  if (authError || !user) return null;

  const mapped = await fetchProfileQuick(user);
  ensureProfile(user).catch(() => {});
  return mapped;
}

export async function updateProfile(fields) {
  const saved = await saveProfileDirect(fields);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return mapProfile(saved, user);
}

export async function uploadAvatar(file) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const ext = file.name.split(".").pop();
  const path = `avatars/${user.id}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function signUpWithProfile(form) {
  const metadata = {
    full_name: form.name?.trim(),
    phone: form.phone?.trim(),
    address_line: form.addressLine?.trim(),
    city: form.city?.trim(),
    state: form.state?.trim(),
    country: form.country?.trim() || "Pakistan",
    postal_code: form.postalCode?.trim(),
    avatar_url: form.avatarUrl?.trim() || "",
  };

  const { data, error } = await withTimeout(
    supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: metadata },
    }),
    15000,
    null,
  );

  if (!data) throw new Error("Signup timed out — check your internet connection");
  if (error) throw error;
  if (!data.user) throw new Error("Signup failed — no user returned");

  if (data.session) {
    const user = await fetchProfileQuick(data.user);

    saveProfileDirect({
      full_name: form.name,
      phone: form.phone,
      address_line: form.addressLine,
      city: form.city,
      state: form.state,
      country: form.country || "Pakistan",
      postal_code: form.postalCode,
      avatar_url: form.avatarUrl || "",
    }).catch(() => {});

    return {
      user,
      session: data.session,
      token: data.session.access_token,
      needsEmailConfirm: false,
    };
  }

  return {
    user: null,
    session: null,
    token: null,
    needsEmailConfirm: true,
  };
}

export async function signIn(email, password) {
  const result = await withTimeout(
    supabase.auth.signInWithPassword({ email: email.trim(), password }),
    15000,
    null,
  );

  if (!result) {
    throw new Error("Login timed out — check internet or Supabase API key in .env");
  }

  const { data, error } = result;
  if (error) throw error;
  if (!data?.user || !data?.session) {
    throw new Error("Login failed — no session returned");
  }

  const user = await fetchProfileQuick(data.user);
  ensureProfile(data.user).catch(() => {});

  return {
    session: data.session,
    user,
    token: data.session.access_token,
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSessionWithProfile() {
  const { data, error } = await withTimeout(
    supabase.auth.getSession(),
    8000,
    { data: { session: null }, error: null },
  );

  if (error || !data?.session?.user) return null;

  const { session } = data;
  let profile = null;

  try {
    profile = await withTimeout(fetchProfileById(session.user.id), 5000, null);
  } catch {
    profile = null;
  }

  return {
    session,
    user: mapProfile(profile, session.user),
    token: session.access_token,
  };
}

/** Run after app is visible — fills missing profile fields without blocking UI */
export async function syncProfileInBackground() {
  const { data: { user } } = await withTimeout(
    supabase.auth.getUser(),
    5000,
    { data: { user: null } },
  );
  if (!user) return null;

  try {
    const profile = await withTimeout(ensureProfile(user), 8000, null);
    return mapProfile(profile, user);
  } catch {
    return mapProfile(null, user);
  }
}
