-- Migration 005: Google OAuth Support for AnswerPulse
-- Run this in Supabase SQL Editor
--
-- Creates auth_providers table and enhances user creation triggers
-- to support Google OAuth login while preserving existing functionality.

-- =============================================
-- 1. Auth providers table
-- =============================================
-- Links users to third-party login identities (Google, GitHub, etc.)

CREATE TABLE IF NOT EXISTS public.auth_providers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,                        -- 'google', 'github', etc.
  provider_sub text NOT NULL,                    -- Third-party unique user ID (e.g., Google sub)
  provider_email text,                           -- Email from third-party
  provider_email_verified boolean DEFAULT false, -- Whether third-party verified the email
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(provider, provider_sub)
);

ALTER TABLE public.auth_providers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own auth providers"
  ON public.auth_providers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage auth providers"
  ON public.auth_providers FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auth_providers_provider_sub
  ON public.auth_providers(provider, provider_sub);

CREATE INDEX IF NOT EXISTS idx_auth_providers_user_id
  ON public.auth_providers(user_id);

-- =============================================
-- 2. Add avatar_url to profiles table (if not exists)
-- =============================================
-- OAuth providers (like Google) return a profile picture URL

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- =============================================
-- 3. Enhanced handle_new_user() trigger
-- =============================================
-- Replaces the existing trigger to handle both email and OAuth signups,
-- capturing full_name and avatar_url from OAuth metadata.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name text;
  v_avatar_url text;
BEGIN
  -- Determine full_name from metadata (Google uses 'full_name' or 'name')
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1)  -- fallback: email prefix
  );

  -- Determine avatar_url from metadata (Google uses 'picture' or 'avatar_url')
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  INSERT INTO public.profiles (id, email, full_name, avatar_url, plan, scans_used, scans_reset_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_avatar_url,
    'free',
    0,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent concurrent insert conflicts

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 4. OAuth login recording trigger
-- =============================================
-- Records third-party login details in auth_providers table

CREATE OR REPLACE FUNCTION public.handle_oauth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_provider text;
  v_sub text;
  v_email text;
  v_email_verified boolean;
BEGIN
  -- Get provider from raw_app_meta_data
  v_provider := NEW.raw_app_meta_data->>'provider';

  -- Only record if this is an OAuth login
  IF v_provider IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get provider sub (Google uses 'sub', some use 'id')
  v_sub := COALESCE(
    NEW.raw_user_meta_data->>'sub',
    NEW.raw_user_meta_data->>'id',
    NEW.raw_user_meta_data->>'provider_id'
  );

  -- Skip if no sub found
  IF v_sub IS NULL OR v_sub = '' THEN
    RETURN NEW;
  END IF;

  v_email := NEW.raw_user_meta_data->>'email';
  v_email_verified := (NEW.raw_user_meta_data->>'email_verified')::boolean;

  -- Insert or ignore (on conflict with unique constraint)
  INSERT INTO public.auth_providers (user_id, provider, provider_sub, provider_email, provider_email_verified)
  VALUES (NEW.id, v_provider, v_sub, v_email, v_email_verified)
  ON CONFLICT (provider, provider_sub) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the OAuth trigger
DROP TRIGGER IF EXISTS on_auth_oauth_user ON auth.users;
CREATE TRIGGER on_auth_oauth_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_oauth_user();

-- =============================================
-- 5. Verification queries (optional — for debugging)
-- =============================================
-- Check auth_providers table structure:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'auth_providers'
-- ORDER BY ordinal_position;
--
-- Check triggers on auth.users:
-- SELECT trigger_name, event_manipulation, action_timing
-- FROM information_schema.triggers
-- WHERE event_object_table = 'users' AND event_object_schema = 'auth';
