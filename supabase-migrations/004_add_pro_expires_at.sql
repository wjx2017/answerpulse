-- Migration: Add pro_expires_at for 30-day Pro access
-- Run this in Supabase SQL Editor

-- Add pro_expires_at column to profiles table
-- NULL means the user has never had Pro or it expired long ago
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ;

-- Backward compatibility: existing Pro users without pro_expires_at
-- Get 30 days from NOW so they don't lose access abruptly
UPDATE profiles
  SET pro_expires_at = NOW() + INTERVAL '30 days'
  WHERE plan = 'pro' AND pro_expires_at IS NULL;
