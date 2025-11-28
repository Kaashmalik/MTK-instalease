-- ============================================================================
-- Email Templates Configuration for InstalEase
-- ============================================================================
-- This script provides SQL to update email templates in Supabase
-- Note: Email templates are usually configured via Dashboard, but this
-- provides the HTML for easy copy-paste
-- ============================================================================

-- ============================================================================
-- IMPORTANT: These templates should be added via Supabase Dashboard
-- Go to: Authentication → Email Templates
-- ============================================================================

-- Template 1: Confirm Signup (Email Verification)
-- Copy this HTML and paste in: Authentication → Email Templates → Confirm signup

/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email - InstalEase</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Welcome to InstalEase! 🎉</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">Hi there! 👋</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">Thanks for signing up for <strong>InstalEase</strong> - your smart installment management platform.</p>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333333;">To get started, please confirm your email address by clicking the button below:</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">Confirm Email Address</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #666666;">Or copy and paste this link into your browser:</p>
              <p style="margin: 0 0 30px; padding: 15px; background-color: #f8f9fa; border-radius: 6px; font-size: 13px; color: #667eea; word-break: break-all; border-left: 4px solid #667eea;">{{ .ConfirmationURL }}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;"><strong>Didn't sign up?</strong> You can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;"><strong>InstalEase</strong> - Streamline Your Installment Management</p>
              <p style="margin: 0; font-size: 12px; color: #999999;">This is an automated email. Please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
*/

-- ============================================================================
-- For Development: Disable Email Confirmation
-- ============================================================================
-- Run this if you want to skip email verification during development
-- WARNING: Re-enable for production!

-- This is configured in Supabase Dashboard, not via SQL
-- Go to: Authentication → Providers → Email → Turn OFF "Confirm email"

-- ============================================================================
-- Manually Confirm Existing Users
-- ============================================================================
-- Use this to manually confirm users who didn't receive emails

-- Confirm specific user
-- Note: confirmed_at and updated_at are generated columns and will auto-update
UPDATE auth.users
SET 
  email_confirmed_at = NOW()
WHERE email = 'user@example.com'; -- Replace with actual email

-- Confirm all unconfirmed users (USE WITH CAUTION!)
-- Note: confirmed_at and updated_at are generated columns and will auto-update
-- UPDATE auth.users
-- SET 
--   email_confirmed_at = NOW()
-- WHERE email_confirmed_at IS NULL;

-- ============================================================================
-- Check Email Confirmation Status
-- ============================================================================

-- View all users and their confirmation status
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Pending'
  END as status
FROM auth.users
ORDER BY created_at DESC;

-- Count confirmed vs unconfirmed users
SELECT 
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unconfirmed_users,
  COUNT(*) as total_users
FROM auth.users;
