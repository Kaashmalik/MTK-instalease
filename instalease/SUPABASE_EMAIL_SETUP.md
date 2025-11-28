# Supabase Email Verification Setup

## ✅ Email Verification Page Created

The `/auth/verify-email` page has been created and is ready to use.

## 🔧 Supabase Configuration Required

To enable email verification, configure these settings in your Supabase Dashboard:

### Step 1: Configure Email Templates

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Customize the **Confirm signup** template if needed
3. The default template should work fine

### Step 2: Set Site URL and Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/verify-email`
   - `http://localhost:3001/auth/verify-email` (if using port 3001)
   - Your production URL: `https://your-domain.com/auth/verify-email`

### Step 3: Email Provider Settings

1. Go to **Authentication** → **Providers** → **Email**
2. Ensure **Enable email provider** is ON
3. Configure SMTP settings (optional, uses Supabase default if not set)

### Step 4: Email Confirmation Settings

1. Go to **Authentication** → **Providers** → **Email**
2. **Enable email confirmations**: 
   - ✅ **ON** - Users must verify email before signing in (recommended for production)
   - ⚠️ **OFF** - Users can sign in immediately (useful for development/testing)

**For Development:**
- You can disable email confirmation temporarily to test faster
- Or use the Supabase dashboard to manually confirm users

**For Production:**
- Keep email confirmation enabled for security

## 📧 How It Works

1. **User Signs Up:**
   - User fills out signup form
   - Account is created in Supabase Auth
   - Verification email is sent automatically

2. **User Clicks Email Link:**
   - Supabase verifies the token
   - User is redirected to `/auth/verify-email`
   - Session is automatically created
   - User is redirected to dashboard

3. **If User Doesn't Receive Email:**
   - User can click "Resend Verification Email" on the verify-email page
   - Or check spam folder

## 🧪 Testing Email Verification

### Option 1: Disable for Development (Quick Testing)

1. Go to Supabase Dashboard → Authentication → Providers → Email
2. Turn OFF "Enable email confirmations"
3. Users can sign in immediately after signup

### Option 2: Use Supabase Dashboard (Manual Verification)

1. User signs up (email not verified)
2. Go to Supabase Dashboard → Authentication → Users
3. Find the user
4. Click "..." → "Send verification email" or manually confirm

### Option 3: Test with Real Email

1. Use a real email address
2. Check inbox for verification email
3. Click the link
4. Should redirect to verify-email page and then dashboard

## 🔍 Troubleshooting

### Email Not Received

- Check spam/junk folder
- Verify email address is correct
- Check Supabase email logs: **Authentication** → **Logs**
- Ensure SMTP is configured (or using Supabase default)

### Redirect URL Not Working

- Verify redirect URL is added in Supabase settings
- Check that URL matches exactly (including http/https, port, path)
- Clear browser cache and try again

### 404 Error on Verify-Email Page

- ✅ **FIXED**: The page has been created at `/auth/verify-email`
- Restart your dev server if needed: `npm run dev`

### User Stuck on Verify Page

- Check browser console for errors
- Verify Supabase credentials in `.env.local`
- Check Supabase dashboard for user status

## 📝 Next Steps

1. ✅ Email verification page created
2. ⚠️ Configure redirect URLs in Supabase Dashboard
3. ⚠️ Set email confirmation preference (ON for production, OFF for dev)
4. ✅ Test signup flow

---

**Need Help?** Contact support@maliktech.com

