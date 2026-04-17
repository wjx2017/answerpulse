-- Migration: Add scan increment RPC function
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION increment_scan_count(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET scans_used = scans_used + 1
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
