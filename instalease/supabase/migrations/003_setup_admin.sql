-- ============================================================================
-- Setup Admin User and Shop
-- ============================================================================
-- This migration sets up the project owner as an admin user
-- Email: mtkinstalease@gmail.com
-- 
-- Run this in Supabase SQL Editor after the user has signed up
-- ============================================================================

-- Function to safely set up admin user and shop
CREATE OR REPLACE FUNCTION setup_admin_user(
  p_email TEXT,
  p_shop_name TEXT DEFAULT 'InstalEase Admin Shop'
)
RETURNS TABLE(
  user_id UUID,
  shop_id UUID,
  username TEXT,
  role TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_shop_id UUID;
  v_username TEXT;
  v_existing_shop_id UUID;
BEGIN
  -- Find user by email in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  -- Check if user exists
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      ('User with email ' || p_email || ' not found. Please sign up first.')::TEXT;
    RETURN;
  END IF;

  -- Check if shop already exists for this user
  SELECT shop_id INTO v_existing_shop_id
  FROM users
  WHERE user_id = v_user_id
  AND shop_id IS NOT NULL;

  -- Create shop if user doesn't have one
  IF v_existing_shop_id IS NULL THEN
    INSERT INTO shops (shop_name, subscription_status)
    VALUES (p_shop_name, 'active')
    RETURNING shop_id INTO v_shop_id;
  ELSE
    v_shop_id := v_existing_shop_id;
  END IF;

  -- Get username from existing user record or use email prefix
  SELECT username INTO v_username
  FROM users
  WHERE user_id = v_user_id;

  IF v_username IS NULL THEN
    v_username := split_part(p_email, '@', 1);
  END IF;

  -- Insert or update user profile with admin role and shop_id
  INSERT INTO users (user_id, shop_id, username, role)
  VALUES (v_user_id, v_shop_id, v_username, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'admin',
    shop_id = COALESCE(users.shop_id, v_shop_id),
    username = COALESCE(users.username, v_username),
    updated_at = NOW();

  RETURN QUERY SELECT 
    v_user_id,
    v_shop_id,
    v_username,
    'admin'::TEXT,
    ('Admin user setup complete for ' || p_email)::TEXT;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION setup_admin_user(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION setup_admin_user(TEXT, TEXT) TO service_role;

-- ============================================================================
-- Run the setup for the project owner
-- ============================================================================
-- Execute this to set up the admin user
SELECT * FROM setup_admin_user('mtkinstalease@gmail.com', 'InstalEase Admin Shop');

-- ============================================================================
-- Alternative: Direct update (if function doesn't work)
-- ============================================================================
-- If the function approach doesn't work, you can run this directly:
-- 
-- Step 1: Find the user_id from auth.users
-- SELECT id, email FROM auth.users WHERE email = 'mtkinstalease@gmail.com';
--
-- Step 2: Create a shop (if needed)
-- INSERT INTO shops (shop_name, subscription_status)
-- VALUES ('InstalEase Admin Shop', 'active')
-- RETURNING shop_id;
--
-- Step 3: Update the user record (replace USER_ID_HERE and SHOP_ID_HERE)
-- UPDATE users
-- SET role = 'admin',
--     shop_id = 'SHOP_ID_HERE'
-- WHERE user_id = 'USER_ID_HERE';
--
-- Or insert if user profile doesn't exist:
-- INSERT INTO users (user_id, shop_id, username, role)
-- VALUES (
--   'USER_ID_HERE',
--   'SHOP_ID_HERE',
--   'mtkinstalease',
--   'admin'
-- )
-- ON CONFLICT (user_id) DO UPDATE SET
--   role = 'admin',
--   shop_id = EXCLUDED.shop_id;

