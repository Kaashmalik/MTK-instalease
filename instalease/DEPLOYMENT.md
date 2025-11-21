# InstalEase Deployment Guide

This guide covers deploying InstalEase to production using Vercel and Supabase.

## Prerequisites

- GitHub account with repository access
- Vercel account (free tier available)
- Supabase account (upgrade to production tier)
- Sentry account (for error tracking)
- Domain name (optional, for custom domain)

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Vercel Deployment](#vercel-deployment)
3. [Supabase Production Setup](#supabase-production-setup)
4. [Environment Variables](#environment-variables)
5. [CI/CD Configuration](#cicd-configuration)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring Setup](#monitoring-setup)

## Initial Setup

### 1. Prepare Your Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for production deployment"

# Push to GitHub (create repo if needed)
git remote add origin https://github.com/your-username/instalease.git
git push -u origin main
```

### 2. Install Vercel CLI (Optional)

```bash
npm install -g vercel
vercel login
```

## Vercel Deployment

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Create New Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the `instalease` directory as the root directory

2. **Configure Project Settings**
   - **Framework Preset**: Next.js
   - **Root Directory**: `instalease`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm ci`

3. **Add Environment Variables**
   - See [Environment Variables](#environment-variables) section below
   - Add all required variables in Vercel dashboard
   - Settings → Environment Variables

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Note your deployment URL

### Option B: Deploy via CLI

```bash
cd instalease
vercel --prod
```

Follow the prompts to:
- Link to existing project or create new
- Set up environment variables
- Confirm deployment

## Supabase Production Setup

### 1. Upgrade to Production Tier

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → Billing
4. Upgrade to Production tier (or Pro tier for better performance)

### 2. Run Production Migrations

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 3. Enable Production Features

- **Realtime**: Settings → API → Enable Realtime
- **Row Level Security**: Verify all RLS policies are enabled
- **Database Backups**: Settings → Database → Enable automatic backups
- **Connection Pooling**: Settings → Database → Enable connection pooling

### 4. Configure Production Database

```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check indexes for performance
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public';
```

## Environment Variables

### Required Variables for Production

Add these in Vercel Dashboard (Settings → Environment Variables):

#### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Sentry
```
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### Payment Gateways (Production Keys)
```
JAZZCASH_MERCHANT_ID=your-production-merchant-id
JAZZCASH_PASSWORD=your-production-password
JAZZCASH_INTEGRITY_SALT=your-production-salt

EASYPAISA_STORE_ID=your-production-store-id
EASYPAISA_HASH_KEY=your-production-hash-key

RAAST_API_KEY=your-production-api-key
RAAST_API_SECRET=your-production-api-secret
```

#### Notifications
```
TWILIO_ACCOUNT_SID=your-production-account-sid
TWILIO_AUTH_TOKEN=your-production-auth-token
TWILIO_PHONE_NUMBER=your-production-phone-number

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-production-email
SMTP_PASSWORD=your-production-app-password
```

#### App Configuration
```
NODE_ENV=production
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Environment Variable Setup in Vercel

1. Go to Project Settings → Environment Variables
2. Add each variable for:
   - **Production** environment
   - **Preview** environment (optional, for staging)
   - **Development** environment (optional)

3. **Important**: Never commit `.env` files to Git. Use Vercel's environment variables.

## CI/CD Configuration

### GitHub Secrets Setup

Add these secrets in GitHub (Settings → Secrets and variables → Actions):

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

### How to Get Vercel Token

1. Go to Vercel Dashboard → Settings → Tokens
2. Create a new token
3. Copy and add to GitHub secrets

### CI/CD Workflow

The workflow (`.github/workflows/ci.yml`) automatically:
- Runs linting and type checking on every push
- Runs unit tests
- Runs E2E tests
- Builds the application
- Deploys to Vercel (only on `main` branch)
- Creates Sentry release with source maps

## Post-Deployment Verification

### 1. Run Verification Script

```bash
# From project root
cd instalease
npm run verify:production
```

### 2. Manual Checks

- [ ] Application loads without errors
- [ ] Authentication works (login/signup)
- [ ] Dashboard displays correctly
- [ ] API endpoints respond correctly
- [ ] Payment callbacks work
- [ ] Real-time updates function
- [ ] Error tracking in Sentry
- [ ] Database connections stable
- [ ] SSL certificate valid
- [ ] Performance metrics acceptable

### 3. Test Critical Flows

1. **User Registration**
   - Create new account
   - Verify email (if enabled)
   - Login successfully

2. **Contract Creation**
   - Create new contract
   - Verify data saved correctly
   - Check installments generated

3. **Payment Processing**
   - Process test payment
   - Verify callback received
   - Check payment recorded

4. **Customer Portal**
   - Access customer portal
   - View balance and installments
   - Check payment history

## Monitoring Setup

### 1. Sentry Error Tracking

- Errors automatically tracked
- View in [Sentry Dashboard](https://sentry.io)
- Set up alerts for critical errors
- Configure release tracking

### 2. Vercel Analytics

- Enable in Vercel Dashboard → Analytics
- Monitor performance metrics
- Track page views and user behavior

### 3. Supabase Monitoring

- Monitor database performance
- Check connection pool usage
- Review query performance
- Set up alerts for high usage

### 4. Uptime Monitoring

Set up external monitoring (optional):
- [UptimeRobot](https://uptimerobot.com)
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

## Custom Domain Setup

1. **Add Domain in Vercel**
   - Project Settings → Domains
   - Add your domain
   - Follow DNS configuration instructions

2. **Configure DNS**
   - Add CNAME record pointing to Vercel
   - Wait for DNS propagation (up to 48 hours)

3. **SSL Certificate**
   - Automatically provisioned by Vercel
   - Force HTTPS in project settings

## Rollback Procedure

If deployment fails:

1. **Via Vercel Dashboard**
   - Go to Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Via CLI**
   ```bash
   vercel rollback
   ```

## Troubleshooting

### Build Failures

- Check build logs in Vercel
- Verify all environment variables set
- Ensure dependencies install correctly
- Check for TypeScript errors

### Runtime Errors

- Check Sentry for error details
- Review Vercel function logs
- Verify database connections
- Check API endpoint responses

### Performance Issues

- Review Vercel Analytics
- Check database query performance
- Optimize images and assets
- Review bundle size

## Security Checklist

- [ ] All environment variables secured
- [ ] RLS policies enabled on all tables
- [ ] API keys rotated to production keys
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting configured (if needed)
- [ ] Audit logging enabled
- [ ] Backup strategy in place

## Support

For issues or questions:
- Check [README.md](./README.md)
- Review [CHANGELOG.md](./CHANGELOG.md)
- Open GitHub issue
- Contact support team

---

**Last Updated**: Phase 4 - Production Deployment
**Version**: 1.0.0

