-- ============================================================================
-- Confirm Admin Email Address
-- ============================================================================
-- This script manually confirms the email address for the admin user
-- This bypasses the email verification requirement
-- ============================================================================

-- Update the email_confirmed_at timestamp in auth.users
-- Note: confirmed_at is a generated column and will auto-update
UPDATE auth.users
SET 
  email_confirmed_at = NOW()
WHERE email = 'mtkinstalease@gmail.com';

-- Verify the update
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE email = 'mtkinstalease@gmail.com';

-- ============================================================================
-- Alternative: If you want to disable email confirmation for development
-- ============================================================================
-- Go to Supabase Dashboard:
-- 1. Authentication → Providers → Email
-- 2. Turn OFF "Enable email confirmations"
-- 3. This allows users to sign in immediately after signup
-- ============================================================================

