-- ============================================================================
-- Direct Admin Setup Script
-- ============================================================================
-- Run this directly in Supabase SQL Editor
-- This script will:
-- 1. Find your user by email
-- 2. Create an admin shop for you
-- 3. Set your role to 'admin' and assign the shop
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_shop_id UUID;
  v_username TEXT;
BEGIN
  -- Step 1: Find user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'mtkinstalease@gmail.com'
  LIMIT 1;

  -- Check if user exists
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email mtkinstalease@gmail.com not found. Please sign up first at /auth/signup';
  END IF;

  -- Step 2: Check if user already has a shop
  SELECT shop_id INTO v_shop_id
  FROM users
  WHERE user_id = v_user_id
  AND shop_id IS NOT NULL;

  -- Step 3: Create shop if user doesn't have one
  IF v_shop_id IS NULL THEN
    INSERT INTO shops (shop_name, subscription_status)
    VALUES ('InstalEase Admin Shop', 'active')
    RETURNING shop_id INTO v_shop_id;
    
    RAISE NOTICE 'Created new shop with ID: %', v_shop_id;
  ELSE
    RAISE NOTICE 'User already has shop with ID: %', v_shop_id;
  END IF;

  -- Step 4: Get or create username
  SELECT username INTO v_username
  FROM users
  WHERE user_id = v_user_id;

  IF v_username IS NULL THEN
    v_username := 'mtkinstalease';
  END IF;

  -- Step 5: Insert or update user profile with admin role
  INSERT INTO users (user_id, shop_id, username, role)
  VALUES (v_user_id, v_shop_id, v_username, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'admin',
    shop_id = COALESCE(users.shop_id, v_shop_id),
    username = COALESCE(users.username, v_username),
    updated_at = NOW();

  RAISE NOTICE 'Admin user setup complete!';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Shop ID: %', v_shop_id;
  RAISE NOTICE 'Username: %', v_username;
  RAISE NOTICE 'Role: admin';
END $$;

-- Verify the setup
SELECT 
  u.user_id,
  u.username,
  u.role,
  u.shop_id,
  s.shop_name,
  s.subscription_status,
  au.email
FROM users u
LEFT JOIN shops s ON u.shop_id = s.shop_id
LEFT JOIN auth.users au ON u.user_id = au.id
WHERE au.email = 'mtkinstalease@gmail.com';

