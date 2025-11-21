# Phase 4: Deployment Output & Verification

This document contains all deployment steps, configuration files, and verification commands for InstalEase production deployment.

## 📋 Deployment Steps Summary

### 1. Vercel Deployment

#### Create New Project
```bash
# Option A: Via Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import GitHub repository
4. Configure:
   - Framework: Next.js
   - Root Directory: instalease
   - Build Command: npm run build
   - Output Directory: .next

# Option B: Via CLI
cd instalease
npm install -g vercel
vercel login
vercel --prod
```

### 2. Environment Variables Setup

Add these in **Vercel Dashboard → Project Settings → Environment Variables**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token
NEXT_PUBLIC_APP_VERSION=1.0.0

# Payment Gateways (Production Keys)
JAZZCASH_MERCHANT_ID=your-production-merchant-id
JAZZCASH_PASSWORD=your-production-password
JAZZCASH_INTEGRITY_SALT=your-production-salt

EASYPAISA_STORE_ID=your-production-store-id
EASYPAISA_HASH_KEY=your-production-hash-key

RAAST_API_KEY=your-production-api-key
RAAST_API_SECRET=your-production-api-secret

# Notifications
TWILIO_ACCOUNT_SID=your-production-account-sid
TWILIO_AUTH_TOKEN=your-production-auth-token
TWILIO_PHONE_NUMBER=your-production-phone-number

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-production-email
SMTP_PASSWORD=your-production-app-password

# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 3. Supabase Production Setup

```bash
# Upgrade to Production Tier
1. Go to Supabase Dashboard → Settings → Billing
2. Upgrade to Production tier

# Run Migrations
npm install -g supabase
supabase link --project-ref your-project-ref
supabase db push

# Enable Features
- Settings → API → Enable Realtime
- Settings → Database → Enable backups
- Settings → Database → Enable connection pooling
```

### 4. GitHub Actions CI/CD Setup

Add these secrets in **GitHub → Repository → Settings → Secrets and variables → Actions**:

```bash
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

**Get Vercel Token**: Vercel Dashboard → Settings → Tokens → Create Token

### 5. Deploy

```bash
# Push to main branch (triggers automatic deployment)
git push origin main

# Or deploy manually via Vercel Dashboard
# Click "Deploy" button
```

## 📝 Updated Environment Variable Examples

See `env.example` for complete list. Key additions for production:

```bash
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# App Version (for release tracking)
NEXT_PUBLIC_APP_VERSION=1.0.0

# Environment
NODE_ENV=production
```

## 🔧 GitHub Actions YAML

The enhanced CI/CD pipeline (`.github/workflows/ci.yml`) includes:

### Key Features:
- ✅ Lint and type checking on every push
- ✅ Unit tests with coverage
- ✅ E2E tests with Playwright
- ✅ Production build with Sentry integration
- ✅ Automatic deployment to Vercel on main branch
- ✅ Sentry release creation with source maps
- ✅ Post-deployment verification

### Workflow Triggers:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Automatic deployment only on `main` branch

### Jobs:
1. **lint**: ESLint + TypeScript checking
2. **test**: Unit tests with coverage
3. **e2e**: End-to-end tests
4. **build**: Production build
5. **deploy**: Vercel deployment + Sentry release

## ✅ App Verification Commands

### Production Verification Script

```bash
# Set deployment URL
export VERCEL_URL=https://your-app.vercel.app

# Run verification
cd instalease
npm run verify:production
```

### Manual Verification Checklist

```bash
# 1. Check application accessibility
curl -I https://your-app.vercel.app

# 2. Verify HTTPS
curl -I https://your-app.vercel.app | grep -i "strict-transport-security"

# 3. Check security headers
curl -I https://your-app.vercel.app | grep -i "x-"

# 4. Test API endpoints (if health endpoint exists)
curl https://your-app.vercel.app/api/health

# 5. Check Sentry errors
# Visit: https://sentry.io and check for errors

# 6. Verify database connection
# Check Supabase Dashboard → Database → Connection Pooling

# 7. Test authentication
# Visit: https://your-app.vercel.app/auth/login

# 8. Load testing
cd instalease
npm run load-test
```

### Security Audit Commands

```bash
# Dependency audit
cd instalease
npm audit
npm audit fix

# Type checking
npm run lint
npx tsc --noEmit

# Security headers check
curl -I https://your-app.vercel.app | grep -i "x-frame-options"
curl -I https://your-app.vercel.app | grep -i "strict-transport-security"
curl -I https://your-app.vercel.app | grep -i "x-content-type-options"

# SSL/TLS check
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=your-app.vercel.app
```

### Load Testing Commands

```bash
# Full load test suite
cd instalease
npm run load-test

# Quick load test
npm run load-test:quick

# Custom load test
artillery run load-tests/load-test.yml --target https://your-app.vercel.app
```

## 📊 Verification Output Example

When running `npm run verify:production`, you should see:

```
🔍 InstalEase Production Verification

Target: https://your-app.vercel.app

Checking Application is accessible... ✅ PASSED
Checking HTTPS is enabled... ✅ PASSED
Checking Security headers are present... ✅ PASSED
Checking API is responding... ✅ PASSED
Checking Sentry is configured... ✅ PASSED

📊 Verification Summary

Total checks: 5
✅ Passed: 5
❌ Failed: 0
```

## 🔐 Production Keys Checklist

Before deploying, ensure you have:

- [ ] **Supabase**: Production project URL and keys
- [ ] **Sentry**: DSN, Org, Project, Auth Token
- [ ] **JazzCash**: Production merchant ID, password, integrity salt
- [ ] **EasyPaisa**: Production store ID and hash key
- [ ] **Raast**: Production API key and secret
- [ ] **Twilio**: Production account SID, auth token, phone number
- [ ] **SMTP**: Production email and app password
- [ ] **Vercel**: Token, Org ID, Project ID

## 📚 Documentation Files

All documentation is available in the repository:

- **[DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md)** - Quick deployment reference
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[BETA_TESTING.md](./BETA_TESTING.md)** - Beta testing guide
- **[SECURITY_AUDIT.md](./SECURITY_AUDIT.md)** - Security checklist
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history
- **[PHASE4_SUMMARY.md](./PHASE4_SUMMARY.md)** - Phase 4 implementation summary

## 🚀 Quick Start Deployment

```bash
# 1. Set up Vercel project (via dashboard or CLI)
# 2. Add all environment variables in Vercel
# 3. Configure Supabase production tier
# 4. Add GitHub secrets
# 5. Push to main branch

git push origin main

# 6. Verify deployment
npm run verify:production
```

## 🐛 Troubleshooting

### Build Fails
```bash
# Check build logs in Vercel
# Verify environment variables
npm run lint
npx tsc --noEmit
```

### Deployment Issues
```bash
# Check GitHub Actions logs
# Verify Vercel token and project ID
# Check environment variables in Vercel
```

### Runtime Errors
```bash
# Check Sentry dashboard
# Review Vercel function logs
# Verify database connections
```

## 📞 Support

- **Deployment Issues**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Security Questions**: See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
- **Beta Testing**: See [BETA_TESTING.md](./BETA_TESTING.md)

---

**Phase 4 Status**: ✅ **COMPLETE**

All deployment infrastructure, documentation, and verification tools are ready for production use.

