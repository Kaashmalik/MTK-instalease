-- ============================================================================
-- Create Admin Profile for mtkinstalease@gmail.com
-- ============================================================================
-- Run this in Supabase SQL Editor to create the user profile
-- ============================================================================

-- First, get the user_id from auth.users
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user_id for the admin email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'mtkinstalease@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not found with email mtkinstalease@gmail.com';
    RETURN;
  END IF;

  -- Insert or update user profile
  INSERT INTO public.users (
    user_id,
    email,
    username,
    role,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    'mtkinstalease@gmail.com',
    'admin',
    'admin',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

  RAISE NOTICE 'Admin profile created/updated for user_id: %', v_user_id;
END $$;

-- Verify the profile was created
SELECT 
  u.user_id,
  u.email,
  u.username,
  u.role,
  u.shop_id,
  u.created_at
FROM public.users u
WHERE u.email = 'mtkinstalease@gmail.com';

-- Also show all users in the table
SELECT 
  user_id,
  email,
  username,
  role,
  shop_id,
  created_at
FROM public.users
ORDER BY created_at DESC;
