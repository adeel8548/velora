-- =============================================================================
-- FIX: Profiles insert/update for signup & admin
-- Run in Supabase SQL Editor AFTER complete-schema.sql
-- =============================================================================

-- 1. Allow users to INSERT their own profile (fallback if trigger missed)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Improved trigger — save ALL signup metadata into profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    address_line,
    city,
    state,
    country,
    postal_code,
    avatar_url,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address_line',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    COALESCE(NEW.raw_user_meta_data->>'country', 'Pakistan'),
    NEW.raw_user_meta_data->>'postal_code',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'role', '')::public.user_role,
      'user'::public.user_role
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email        = EXCLUDED.email,
    full_name    = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    phone        = COALESCE(EXCLUDED.phone, profiles.phone),
    address_line = COALESCE(EXCLUDED.address_line, profiles.address_line),
    city         = COALESCE(EXCLUDED.city, profiles.city),
    state        = COALESCE(EXCLUDED.state, profiles.state),
    country      = COALESCE(EXCLUDED.country, profiles.country),
    postal_code  = COALESCE(EXCLUDED.postal_code, profiles.postal_code),
    avatar_url   = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at   = NOW();

  RETURN NEW;
END;
$$;

-- 3. RPC: upsert profile safely (called from frontend after login)
CREATE OR REPLACE FUNCTION public.upsert_my_profile(
  p_full_name    TEXT DEFAULT NULL,
  p_phone        TEXT DEFAULT NULL,
  p_address_line TEXT DEFAULT NULL,
  p_city         TEXT DEFAULT NULL,
  p_state        TEXT DEFAULT NULL,
  p_country      TEXT DEFAULT NULL,
  p_postal_code  TEXT DEFAULT NULL,
  p_avatar_url   TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user auth.users;
  v_row  public.profiles;
BEGIN
  SELECT * INTO v_user FROM auth.users WHERE id = auth.uid();
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.profiles (
    id, email, full_name, phone, address_line, city, state, country, postal_code, avatar_url, role
  )
  VALUES (
    v_user.id,
    v_user.email,
    p_full_name,
    p_phone,
    p_address_line,
    p_city,
    p_state,
    COALESCE(p_country, 'Pakistan'),
    p_postal_code,
    p_avatar_url,
    'user'::public.user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name    = COALESCE(p_full_name, profiles.full_name),
    phone        = COALESCE(p_phone, profiles.phone),
    address_line = COALESCE(p_address_line, profiles.address_line),
    city         = COALESCE(p_city, profiles.city),
    state        = COALESCE(p_state, profiles.state),
    country      = COALESCE(p_country, profiles.country),
    postal_code  = COALESCE(p_postal_code, profiles.postal_code),
    avatar_url   = COALESCE(p_avatar_url, profiles.avatar_url),
    updated_at   = NOW()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_my_profile TO authenticated;

-- 4. Backfill existing auth users missing profiles
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  'user'::public.user_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 5. Backfill EMPTY address fields from auth signup metadata (run once)
UPDATE public.profiles pr
SET
  full_name    = COALESCE(NULLIF(pr.full_name, ''), u.raw_user_meta_data->>'full_name'),
  phone        = COALESCE(NULLIF(pr.phone, ''), u.raw_user_meta_data->>'phone'),
  address_line = COALESCE(NULLIF(pr.address_line, ''), u.raw_user_meta_data->>'address_line'),
  city         = COALESCE(NULLIF(pr.city, ''), u.raw_user_meta_data->>'city'),
  state        = COALESCE(NULLIF(pr.state, ''), u.raw_user_meta_data->>'state'),
  country      = COALESCE(NULLIF(pr.country, ''), u.raw_user_meta_data->>'country', 'Pakistan'),
  postal_code  = COALESCE(NULLIF(pr.postal_code, ''), u.raw_user_meta_data->>'postal_code'),
  avatar_url   = COALESCE(NULLIF(pr.avatar_url, ''), u.raw_user_meta_data->>'avatar_url'),
  updated_at   = NOW()
FROM auth.users u
WHERE u.id = pr.id
  AND (
    pr.address_line IS NULL OR pr.address_line = ''
    OR pr.city IS NULL OR pr.city = ''
    OR pr.state IS NULL OR pr.state = ''
  );
