# Fix: Email Verification Link Missing

## 🔍 Problem

The verification email is being sent but **doesn't contain a clickable link**. This happens when the redirect URL isn't configured in Supabase.

## ✅ Solution: Configure Supabase Redirect URLs

### Step 1: Add Redirect URL in Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to: https://app.supabase.com
   - Select your project

2. **Open URL Configuration**
   - Go to **Authentication** → **URL Configuration**
   - Or go to **Settings** → **Auth** → **URL Configuration**

3. **Add Redirect URLs**
   Click "Add URL" and add these URLs (one per line):

   ```
   http://localhost:3000/auth/verify-email
   http://localhost:3001/auth/verify-email
   https://your-production-domain.com/auth/verify-email
   ```

   **Important**: 
   - Use `http://` for localhost (not `https://`)
   - Include the port number if using 3001
   - Add your production URL when deploying

4. **Set Site URL**
   - **Site URL**: `http://localhost:3000` (or `3001` if that's your port)
   - This is the base URL for your application

5. **Save Changes**
   - Click **Save** or **Update**

### Step 2: Verify Email Template

1. **Go to Email Templates**
   - Navigate to **Authentication** → **Email Templates**
   - Or **Settings** → **Auth** → **Email Templates**

2. **Check "Confirm signup" Template**
   - The template should include: `{{ .ConfirmationURL }}`
   - This variable is automatically replaced with the verification link

3. **Default Template Should Work**
   The default Supabase template includes:
   ```
   Follow this link to confirm your user: {{ .ConfirmationURL }}
   ```

   If you see this, the template is correct.

### Step 3: Test the Configuration

1. **Sign up a new user**
   - Go to your signup page
   - Create a new account

2. **Check the email**
   - Open your email inbox
   - Find the "Confirm your signup" email from Supabase
   - The email should now contain a clickable link

3. **Click the link**
   - The link should redirect to: `http://localhost:3000/auth/verify-email?token=...`
   - Your account should be verified automatically

## 🔧 Alternative: Custom Email Template

If the default template isn't working, you can customize it:

1. **Go to Email Templates** → **Confirm signup**
2. **Edit the template** to ensure it includes:

   ```html
   <h2>Confirm your signup</h2>
   <p>Follow this link to confirm your user:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
   ```

3. **Save the template**

## 🐛 Troubleshooting

### Link Still Not Appearing

1. **Check Redirect URLs are Saved**
   - Go back to URL Configuration
   - Verify URLs are listed and saved

2. **Check Email in Browser**
   - Some email clients hide links
   - Try viewing the email in a web browser (Gmail web version)

3. **Check Email Source**
   - In Gmail: Click "Show original" or "View source"
   - Look for `href=` attributes - the link should be there

4. **Verify emailRedirectTo is Set**
   - Check browser console for any errors
   - The code sets `emailRedirectTo: ${window.location.origin}/auth/verify-email`

### Link Expires Too Quickly

- Default expiration: 24 hours
- To change: Go to **Authentication** → **Settings** → **Email Auth**
- Adjust "Email link expiry" setting

### Link Goes to Wrong URL

- Verify the redirect URL matches exactly (including http/https, port, path)
- Check for typos in the URL
- Ensure no trailing slashes

## 📝 Quick Checklist

- [ ] Redirect URL added in Supabase Dashboard
- [ ] Site URL set correctly
- [ ] Email template includes `{{ .ConfirmationURL }}`
- [ ] Tested with a new signup
- [ ] Email contains clickable link
- [ ] Link redirects to `/auth/verify-email`

## 🎯 Expected Result

After configuration, the verification email should:

1. ✅ Contain a clickable link
2. ✅ Link text: "Confirm your mail" or similar
3. ✅ Link URL: `http://localhost:3000/auth/verify-email?token=...&type=email`
4. ✅ Clicking link verifies account and redirects to dashboard

---

**Still having issues?** 
- Check Supabase logs: **Authentication** → **Logs**
- Verify your `.env.local` has correct Supabase credentials
- Contact support@maliktech.com

