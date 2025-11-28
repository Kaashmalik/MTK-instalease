-- Migration: Auto-create user profile on signup (Fixed Permissions)
-- Date: 2024-11-28
-- Purpose: Automatically create user profile in users table when auth user is created
-- NOTE: Run this in Supabase SQL Editor (it runs as postgres user automatically)

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert new user profile
  INSERT INTO public.users (
    user_id,
    email,
    phone,
    username,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(COALESCE(NEW.email, ''), '@', 1), 'user_' || substring(NEW.id::text, 1, 8)),
    'customer', -- Default role
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate inserts

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when new auth user is created';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to auto-create user profile on signup';

-- Verify trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
