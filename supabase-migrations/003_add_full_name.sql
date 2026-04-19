-- Migration: Add full_name to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update handle_new_user trigger to accept full_name (from metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan, scans_used, scans_reset_at)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'free', 0, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
