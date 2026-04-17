-- Migration: Add profiles plan fields and scan_history table
-- Run this in Supabase SQL Editor

-- Add plan fields to profiles table (Supabase auth.users linked)
-- Note: Supabase creates a profiles table with id FK to auth.users.id
-- We add plan fields here

-- Create scan_history table
CREATE TABLE IF NOT EXISTS scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  score INT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast history queries
CREATE INDEX IF NOT EXISTS idx_scan_history_user_created 
  ON scan_history(user_id, created_at DESC);

-- RLS policies for scan_history
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own scan history
CREATE POLICY "Users can view own scan history"
  ON scan_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own scan history
CREATE POLICY "Users can insert own scan history"
  ON scan_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own scan history
CREATE POLICY "Users can delete own scan history"
  ON scan_history FOR DELETE
  USING (auth.uid() = user_id);

-- Add plan fields to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS scans_used INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scans_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Ensure profiles table has RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except plan)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create function to handle new user registration (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan, scans_used, scans_reset_at)
  VALUES (NEW.id, NEW.email, 'free', 0, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Note: If profiles table doesn't exist yet, create it first:
-- CREATE TABLE IF NOT EXISTS profiles (
--   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--   email TEXT,
--   plan TEXT NOT NULL DEFAULT 'free',
--   scans_used INT NOT NULL DEFAULT 0,
--   scans_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
