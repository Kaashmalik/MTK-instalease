# Quick Deployment Steps - InstalEase

This is a quick reference guide for deploying InstalEase to production. For detailed information, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Prerequisites Checklist

- [ ] GitHub repository created and code pushed
- [ ] Vercel account created
- [ ] Supabase project created (upgrade to production tier)
- [ ] Sentry account created
- [ ] Production API keys obtained (payment gateways, Twilio, SMTP)

## Step 1: Set Up Vercel Project

### Via Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `instalease`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### Via CLI

```bash
cd instalease
npm install -g vercel
vercel login
vercel --prod
```

## Step 2: Configure Environment Variables in Vercel

Go to **Project Settings → Environment Variables** and add:

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Sentry
```
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Payment Gateways (Production Keys)
```
JAZZCASH_MERCHANT_ID=your-production-merchant-id
JAZZCASH_PASSWORD=your-production-password
JAZZCASH_INTEGRITY_SALT=your-production-salt

EASYPAISA_STORE_ID=your-production-store-id
EASYPAISA_HASH_KEY=your-production-hash-key

RAAST_API_KEY=your-production-api-key
RAAST_API_SECRET=your-production-api-secret
```

### Notifications
```
TWILIO_ACCOUNT_SID=your-production-account-sid
TWILIO_AUTH_TOKEN=your-production-auth-token
TWILIO_PHONE_NUMBER=your-production-phone-number

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-production-email
SMTP_PASSWORD=your-production-app-password
```

### App Configuration
```
NODE_ENV=production
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Important**: Select **Production** environment for all variables.

## Step 3: Set Up Supabase Production

1. **Upgrade to Production Tier**
   - Go to Supabase Dashboard → Settings → Billing
   - Upgrade to Production tier

2. **Run Migrations**
   ```bash
   npm install -g supabase
   supabase link --project-ref your-project-ref
   supabase db push
   ```

3. **Enable Features**
   - Settings → API → Enable Realtime
   - Settings → Database → Enable backups
   - Settings → Database → Enable connection pooling

## Step 4: Configure GitHub Secrets

Go to **GitHub Repository → Settings → Secrets and variables → Actions** and add:

```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id

NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

**How to get Vercel token**: Vercel Dashboard → Settings → Tokens → Create Token

## Step 5: Deploy

### First Deployment

1. **Via Vercel Dashboard**:
   - Click "Deploy" button
   - Wait for build to complete
   - Note your deployment URL

2. **Via Git Push** (after CI/CD is set up):
   ```bash
   git push origin main
   ```
   - GitHub Actions will automatically deploy

### Verify Deployment

```bash
# Set your deployment URL
export VERCEL_URL=https://your-app.vercel.app

# Run verification
cd instalease
npm run verify:production
```

## Step 6: Post-Deployment Checks

- [ ] Application loads at deployment URL
- [ ] Login/signup works
- [ ] Dashboard displays correctly
- [ ] Sentry errors are being tracked
- [ ] Real-time updates work
- [ ] Payment callbacks work (test with test payments)
- [ ] SSL certificate is valid (HTTPS)
- [ ] Security headers are present

## Step 7: Set Up Monitoring

1. **Sentry**
   - Go to Sentry Dashboard
   - Verify errors are being received
   - Set up alerts for critical errors

2. **Vercel Analytics**
   - Enable in Vercel Dashboard → Analytics

3. **Supabase Monitoring**
   - Monitor database performance
   - Set up alerts for high usage

## Step 8: Custom Domain (Optional)

1. **Add Domain in Vercel**
   - Project Settings → Domains
   - Add your domain
   - Follow DNS instructions

2. **Configure DNS**
   - Add CNAME record pointing to Vercel
   - Wait for DNS propagation

## Troubleshooting

### Build Fails
- Check build logs in Vercel
- Verify all environment variables are set
- Check for TypeScript errors: `npm run lint`

### App Doesn't Load
- Check Vercel deployment logs
- Verify environment variables
- Check Sentry for errors

### Database Connection Issues
- Verify Supabase URL and keys
- Check RLS policies are enabled
- Verify connection pooling is enabled

## Quick Commands Reference

```bash
# Local development
npm run dev

# Build locally
npm run build

# Run tests
npm test
npm run test:e2e

# Load testing
npm run load-test

# Production verification
npm run verify:production

# Deploy to Vercel
vercel --prod
```

## Support Resources

- **Detailed Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Beta Testing Guide**: [BETA_TESTING.md](./BETA_TESTING.md)
- **Security Audit**: [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)

---

**Ready to Deploy!** 🚀

Follow these steps in order, and your InstalEase application will be live in production.

