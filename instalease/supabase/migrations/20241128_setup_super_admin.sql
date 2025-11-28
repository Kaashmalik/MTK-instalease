-- ============================================================================
-- Setup Super Admin for InstalEase
-- ============================================================================
-- Role Hierarchy:
--   super_admin > admin > shop_owner > credit_manager > sales_rep > customer
--
-- Permissions:
--   super_admin: Can assign shop_id to users, manage all shops, full system access
--   admin: Can manage their assigned shop, users in their shop
--   shop_owner: Can manage their shop's customers, contracts, payments
--   credit_manager: Can approve/reject credit applications
--   sales_rep: Can create customers, contracts (limited view)
--   customer: Can view their own contracts and payments
-- ============================================================================

-- Step 1: Add super_admin to role check constraint (if not exists)
DO $$
BEGIN
  -- Try to add super_admin to the role constraint
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('super_admin', 'admin', 'shop_owner', 'sales_rep', 'credit_manager', 'customer', 'guarantor'));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Constraint update skipped: %', SQLERRM;
END $$;

-- Step 2: Create super_admin profile for mtkinstalease@gmail.com
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

  -- Insert or update user profile as super_admin
  -- Note: users table only has: user_id, shop_id, username, role, last_login, created_at, updated_at
  INSERT INTO public.users (
    user_id,
    username,
    role,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    'superadmin',
    'super_admin',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'super_admin',
    username = 'superadmin',
    updated_at = NOW();

  RAISE NOTICE 'Super admin profile created/updated for user_id: %', v_user_id;
END $$;

-- Step 2: Verify the profile was created
SELECT 
  u.user_id,
  u.email,
  u.username,
  u.role,
  u.shop_id,
  u.created_at
FROM public.users u
WHERE u.email = 'mtkinstalease@gmail.com';

-- ============================================================================
-- Role Management Functions (for super_admin only)
-- ============================================================================

-- Function to assign shop_id to a user (only super_admin can call this)
CREATE OR REPLACE FUNCTION assign_user_to_shop(
  p_target_user_id UUID,
  p_shop_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- Get caller's role
  SELECT role INTO v_caller_role
  FROM public.users
  WHERE user_id = auth.uid();

  -- Only super_admin can assign shop_id
  IF v_caller_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super_admin can assign users to shops';
  END IF;

  -- Update the target user's shop_id
  UPDATE public.users
  SET 
    shop_id = p_shop_id,
    updated_at = NOW()
  WHERE user_id = p_target_user_id;

  RETURN TRUE;
END;
$$;

-- Function to change user role (only super_admin can promote to admin)
CREATE OR REPLACE FUNCTION change_user_role(
  p_target_user_id UUID,
  p_new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_valid_roles TEXT[] := ARRAY['customer', 'sales_rep', 'credit_manager', 'shop_owner', 'admin'];
BEGIN
  -- Get caller's role
  SELECT role INTO v_caller_role
  FROM public.users
  WHERE user_id = auth.uid();

  -- Validate new role
  IF p_new_role = 'super_admin' THEN
    RAISE EXCEPTION 'Cannot assign super_admin role via this function';
  END IF;

  IF NOT (p_new_role = ANY(v_valid_roles)) THEN
    RAISE EXCEPTION 'Invalid role: %', p_new_role;
  END IF;

  -- Only super_admin can promote to admin
  IF p_new_role = 'admin' AND v_caller_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super_admin can promote users to admin';
  END IF;

  -- Admin can change roles within their shop (except to admin)
  IF v_caller_role = 'admin' AND p_new_role != 'admin' THEN
    -- Check if target user is in same shop
    IF NOT EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.users u2 ON u1.shop_id = u2.shop_id
      WHERE u1.user_id = auth.uid()
      AND u2.user_id = p_target_user_id
    ) THEN
      RAISE EXCEPTION 'Admin can only change roles for users in their shop';
    END IF;
  ELSIF v_caller_role != 'super_admin' THEN
    RAISE EXCEPTION 'Insufficient permissions to change user roles';
  END IF;

  -- Update the role
  UPDATE public.users
  SET 
    role = p_new_role,
    updated_at = NOW()
  WHERE user_id = p_target_user_id;

  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION assign_user_to_shop(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION change_user_role(UUID, TEXT) TO authenticated;

-- ============================================================================
-- Show all users and their roles
-- ============================================================================
SELECT 
  user_id,
  email,
  username,
  role,
  shop_id,
  created_at
FROM public.users
ORDER BY 
  CASE role 
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'shop_owner' THEN 3
    WHEN 'credit_manager' THEN 4
    WHEN 'sales_rep' THEN 5
    WHEN 'customer' THEN 6
  END,
  created_at DESC;
