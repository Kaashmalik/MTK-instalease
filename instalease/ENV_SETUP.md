# Environment Variables Setup Guide

This guide will help you obtain all the credentials needed for your `.env.local` file.

## Quick Start

1. Copy the example file:
   ```bash
   cp env.example .env.local
   ```

2. Follow the sections below to get each credential
3. Replace placeholder values in `.env.local` with your actual credentials

---

## 1. Supabase Configuration

### Getting Your Supabase Credentials

1. **Create/Login to Supabase Account**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Sign up or log in

2. **Create a New Project**
   - Click "New Project"
   - Enter project name (e.g., "InstalEase")
   - Set a database password (save this securely)
   - Choose a region closest to your users
   - Click "Create new project"

3. **Get Your Credentials**
   - Go to **Settings** → **API**
   - Copy the following:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep this secret!

### Example:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep secret!)
```

---

## 2. Twilio Configuration (SMS/WhatsApp)

### Getting Your Twilio Credentials

1. **Create Twilio Account**
   - Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - Sign up for a free trial account

2. **Get Account SID and Auth Token**
   - Go to **Console Dashboard**
   - Your **Account SID** is displayed on the dashboard
   - Click "Show" next to Auth Token to reveal it
   - Copy both values

3. **Get a Phone Number**
   - Go to **Phone Numbers** → **Manage** → **Buy a number**
   - Select a number with SMS capabilities
   - For WhatsApp, you need to set up WhatsApp Sandbox (free) or get approved for production

### Example:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Note**: Free trial accounts have limitations. For production, upgrade your account.

---

## 3. Email Configuration (SMTP)

### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Enter "InstalEase" as the name
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Configure in .env.local**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # The app password (remove spaces)
   ```

### Other Email Providers

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASSWORD=your_password
```

**Custom SMTP Server:**
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your_password
```

---

## 4. Payment Gateway Configuration

### JazzCash Setup

1. **Sandbox (Testing)**
   - Go to [JazzCash Sandbox](https://sandbox.jazzcash.com.pk/)
   - Register for a sandbox merchant account
   - Get your Merchant ID, Password, and Integrity Salt

2. **Production**
   - Contact JazzCash for merchant account
   - Complete merchant onboarding process
   - Get production credentials

### Example:
```env
JAZZCASH_MERCHANT_ID=your_merchant_id
JAZZCASH_PASSWORD=your_password
JAZZCASH_INTEGRITY_SALT=your_integrity_salt
```

**Documentation**: [JazzCash API Docs](https://sandbox.jazzcash.com.pk/SandboxDocumentation/ApiReferences.html)

---

### EasyPaisa Setup

1. **Merchant Portal**
   - Go to [EasyPaisa Merchant Portal](https://easypay.easypaisa.com.pk/easypay-merchant/)
   - Register for merchant account
   - Complete verification process

2. **Get Credentials**
   - Go to **Integration** → **API Credentials**
   - Copy Store ID and Hash Key

### Example:
```env
EASYPAISA_STORE_ID=your_store_id
EASYPAISA_HASH_KEY=your_hash_key
```

**Documentation**: [EasyPaisa Integration Guide](https://easypay.easypaisa.com.pk/easypay-merchant/faces/pg/site/IntegrationGuides.jsf)

---

### Raast Setup

1. **Bank Partnership Required**
   - Raast requires partnership with a participating bank
   - Contact banks like Allied Bank, HBL, or UBL
   - Complete partnership agreement

2. **Get API Credentials**
   - Work with your bank partner to get API credentials
   - Get API URL, Key, and Secret

### Example:
```env
RAAST_API_KEY=your_raast_api_key
RAAST_API_SECRET=your_raast_api_secret
RAAST_API_URL=https://api.raast.bank.com/v1/payments
```

**Note**: Raast integration requires bank partnership. Use JazzCash or EasyPaisa for initial development.

---

## 5. Sentry Error Tracking (Optional)

### Getting Sentry Credentials

1. **Create Sentry Account**
   - Go to [https://sentry.io/signup/](https://sentry.io/signup/)
   - Sign up for free account

2. **Create a Project**
   - Go to **Projects** → **Create Project**
   - Select **Next.js** as platform
   - Enter project name (e.g., "InstalEase")
   - Copy the DSN

3. **Get Auth Token**
   - Go to **Settings** → **Auth Tokens**
   - Create new token with scopes: `project:read`, `project:releases`, `org:read`
   - Copy the token

4. **Get Organization and Project Slugs**
   - Organization slug: Found in URL (e.g., `https://sentry.io/organizations/your-org/`)
   - Project slug: Found in project settings

### Example:
```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=instalease
SENTRY_AUTH_TOKEN=your_auth_token_here
```

**Note**: Sentry is optional for development. You can leave these empty and add them later.

---

## 6. Application Configuration

### App Version
```env
NEXT_PUBLIC_APP_VERSION=1.0.0
```
Update this with each release.

### Node Environment
```env
# For local development
NODE_ENV=development

# For production
NODE_ENV=production
```

---

## Verification Checklist

After setting up your `.env.local` file, verify:

- [ ] Supabase URL and keys are correct
- [ ] Can connect to Supabase (run `npm run dev` and check console)
- [ ] Twilio credentials work (test with a simple SMS)
- [ ] SMTP credentials work (test email sending)
- [ ] Payment gateway credentials are valid (test in sandbox)
- [ ] All required variables are set (no "undefined" errors)

---

## Security Best Practices

1. **Never Commit `.env.local`**
   - It's already in `.gitignore`
   - Double-check before committing

2. **Use Different Credentials for Dev/Prod**
   - Development: Use sandbox/test credentials
   - Production: Use production credentials

3. **Rotate Keys Regularly**
   - Change passwords and keys every 90 days
   - Revoke old keys when rotating

4. **Protect Service Role Key**
   - Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code
   - Only use in server-side API routes

5. **Use Environment-Specific Files**
   - `.env.local` - Local development
   - `.env.production` - Production (set in Vercel)
   - `.env.test` - Testing

---

## Troubleshooting

### "Supabase URL or Anon Key is missing"
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart your dev server after adding variables

### "Cannot connect to Supabase"
- Verify your Supabase project is active
- Check that the URL format is correct (should start with `https://`)
- Ensure your IP is not blocked (check Supabase Dashboard → Settings → Network)

### "SMTP authentication failed"
- For Gmail: Use App Password, not regular password
- Check that 2FA is enabled on your Google account
- Verify SMTP port (587 for TLS, 465 for SSL)

### "Payment gateway error"
- Verify you're using correct environment (sandbox vs production)
- Check that credentials match the environment
- Review gateway-specific error messages

---

## Quick Reference

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Supabase Dashboard → Settings → API |
| `TWILIO_ACCOUNT_SID` | ⚠️ For SMS | Twilio Console Dashboard |
| `TWILIO_AUTH_TOKEN` | ⚠️ For SMS | Twilio Console Dashboard |
| `TWILIO_PHONE_NUMBER` | ⚠️ For SMS | Twilio Phone Numbers |
| `SMTP_HOST` | ⚠️ For Email | Email provider settings |
| `SMTP_USER` | ⚠️ For Email | Your email address |
| `SMTP_PASSWORD` | ⚠️ For Email | App password (Gmail) |
| `JAZZCASH_MERCHANT_ID` | ⚠️ For Payments | JazzCash Merchant Portal |
| `EASYPAISA_STORE_ID` | ⚠️ For Payments | EasyPaisa Merchant Portal |
| `RAAST_API_KEY` | ⚠️ For Payments | Bank partner |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ Optional | Sentry Project Settings |

**Legend**: ✅ Required | ⚠️ Required for specific features | ❌ Optional

---

## Next Steps

1. ✅ Set up all environment variables
2. ✅ Run database migrations (see `SETUP.md`)
3. ✅ Test the application locally
4. ✅ Configure production environment variables in Vercel

For more details, see:
- [SETUP.md](./SETUP.md) - Complete setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
- [REALTIME_SETUP.md](./REALTIME_SETUP.md) - Real-time configuration

---

**Need Help?** Contact support@maliktech.com

