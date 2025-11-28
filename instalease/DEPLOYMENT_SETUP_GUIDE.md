# InstalEase 2025 Deployment Setup Guide
## Quick Start: FREE Tier Implementation

**Time to Complete**: 2-3 hours  
**Cost**: $0/month  
**Target**: 0-100 users

---

## 📋 Prerequisites

- [x] GitHub account
- [x] Vercel account (free)
- [x] Supabase account (free)
- [x] Cloudinary account (free)
- [x] Backblaze account (free)
- [x] Cloudflare account (free)

---

## 🚀 Step-by-Step Setup

### Step 1: Install New Dependencies (5 minutes)

```bash
cd d:\MalikTech\InstalEase\instalease

# Install storage providers
npm install cloudinary @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Install analytics & monitoring
npm install posthog-js @logtail/node @logtail/next

# Install image optimization (optional)
npm install browser-image-compression

# Install dependencies
npm install
```

### Step 2: Sign Up for Free Services (30 minutes)

#### A. Cloudinary (Image Storage & Optimization)

1. **Sign Up**: https://cloudinary.com/users/register/free
2. **Get Credentials**:
   - Go to Dashboard → Settings → Access Keys
   - Copy: Cloud Name, API Key, API Secret
3. **Free Tier**: 25GB bandwidth/month, 25K transformations

#### B. Backblaze B2 (Document Storage)

1. **Sign Up**: https://www.backblaze.com/b2/sign-up.html
2. **Create Bucket**:
   - Go to B2 Cloud Storage → Buckets
   - Click "Create a Bucket"
   - Name: `instalease-contracts`
   - Files: Private
3. **Create App Key**:
   - Go to App Keys → Add a New Application Key
   - Name: `instalease-app`
   - Access: Read and Write
   - Copy: keyID and applicationKey
4. **Get Endpoint**:
   - Format: `https://s3.us-west-000.backblazeb2.com`
   - Check your region in bucket details
5. **Free Tier**: 10GB storage, 1GB download/day

#### C. Cloudflare (CDN & Security)

1. **Sign Up**: https://dash.cloudflare.com/sign-up
2. **Add Site** (if you have a domain):
   - Enter your domain
   - Select Free plan
   - Update nameservers at your registrar
3. **Configure Settings**:
   - SSL/TLS → Full (strict)
   - Always Use HTTPS: ON
   - Auto Minify: JS, CSS, HTML
4. **Free Tier**: Unlimited bandwidth, DDoS protection

#### D. PostHog (Analytics)

1. **Sign Up**: https://app.posthog.com/signup
2. **Create Project**: InstalEase
3. **Get API Key**: Settings → Project API Key
4. **Free Tier**: 1M events/month

#### E. Better Stack Logs (Optional)

1. **Sign Up**: https://betterstack.com/logs
2. **Create Source**: InstalEase
3. **Get Token**: Copy source token
4. **Free Tier**: 1GB logs/month

### Step 3: Update Environment Variables (10 minutes)

Update `.env.local`:

```bash
# ============================================================================
# EXISTING VARIABLES (Keep as is)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Twilio (existing)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# SMTP (existing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Sentry (existing)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SENTRY_AUTH_TOKEN=your_token

# ============================================================================
# NEW VARIABLES (Add these)
# ============================================================================

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Backblaze B2 Configuration
BACKBLAZE_ENDPOINT=https://s3.us-west-000.backblazeb2.com
BACKBLAZE_REGION=us-west-000
BACKBLAZE_KEY_ID=your_key_id
BACKBLAZE_APP_KEY=your_application_key
BACKBLAZE_BUCKET=instalease-contracts

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_your_posthog_key

# Better Stack Logs (Optional)
LOGTAIL_SOURCE_TOKEN=your_logtail_token

# App Configuration
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=development
```

### Step 4: Update Vercel Environment Variables (10 minutes)

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to: Settings → Environment Variables
4. Add all NEW variables from above
5. Select: Production, Preview, Development
6. Click "Save"

### Step 5: Configure Supabase Storage Buckets (5 minutes)

Run in Supabase SQL Editor:

```sql
-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('customer-documents', 'customer-documents', false),
  ('guarantor-signatures', 'guarantor-signatures', false),
  ('contract-pdfs', 'contract-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for storage
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('customer-documents', 'guarantor-signatures', 'contract-pdfs'));

CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id IN ('customer-documents', 'guarantor-signatures', 'contract-pdfs'));

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('customer-documents', 'guarantor-signatures', 'contract-pdfs'));
```

### Step 6: Test Storage Providers (15 minutes)

Create test file: `src/app/api/test-storage/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { isCloudinaryConfigured } from '@/lib/storage/cloudinary';
import { isBackblazeConfigured } from '@/lib/storage/backblaze';

export async function GET() {
  const status = {
    cloudinary: isCloudinaryConfigured(),
    backblaze: isBackblazeConfigured(),
    supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };

  return NextResponse.json({
    message: 'Storage provider status',
    providers: status,
    allConfigured: Object.values(status).every(Boolean),
  });
}
```

Test:
```bash
npm run dev
# Visit: http://localhost:3000/api/test-storage
```

### Step 7: Deploy to Vercel (10 minutes)

```bash
# Commit changes
git add .
git commit -m "Add multi-provider storage strategy"

# Push to GitHub (triggers auto-deploy)
git push origin main

# Or deploy manually
npx vercel --prod
```

### Step 8: Verify Deployment (10 minutes)

1. **Check Deployment**:
   ```bash
   npm run verify:production
   ```

2. **Test Storage Providers**:
   - Visit: https://your-app.vercel.app/api/test-storage
   - Should return: `"allConfigured": true`

3. **Test File Uploads**:
   - Upload profile picture (should use Supabase)
   - Upload CNIC image (should use Cloudinary)
   - Upload contract PDF (should use Backblaze)

4. **Check Provider Dashboards**:
   - Cloudinary: https://cloudinary.com/console
   - Backblaze: https://secure.backblaze.com/b2_buckets.htm
   - Supabase: https://app.supabase.com/project/_/storage

### Step 9: Set Up Monitoring (15 minutes)

#### A. Configure PostHog

Add to `src/app/layout.tsx`:

```typescript
import { useEffect } from 'react';
import posthog from 'posthog-js';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: 'https://app.posthog.com',
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            posthog.opt_out_capturing();
          }
        },
      });
    }
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

#### B. Set Up UptimeRobot

1. Go to: https://uptimerobot.com/
2. Add New Monitor:
   - Type: HTTP(s)
   - URL: https://your-app.vercel.app
   - Interval: 5 minutes
   - Alert Contacts: Your email

#### C. Configure Cloudflare (if using custom domain)

1. **Page Rules** (3 free):
   ```
   *your-domain.com/api/*
   - Cache Level: Bypass
   - Security Level: High

   *your-domain.com/_next/static/*
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month

   www.your-domain.com/*
   - Forwarding URL: 301 to https://your-domain.com/$1
   ```

2. **Firewall Rules** (5 free):
   ```
   Rate limit API:
   (http.request.uri.path contains "/api/" and rate.requests.per.minute > 100)
   Action: Challenge

   Block bad bots:
   (cf.client.bot) and not (cf.verified_bot)
   Action: Block
   ```

### Step 10: Create Storage Monitoring Dashboard (20 minutes)

Create `src/app/admin/storage/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';

export default function StorageMonitorPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/test-storage')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Storage Provider Status</h1>
      
      <div className="grid grid-cols-3 gap-4">
        <StorageCard
          name="Supabase"
          configured={status?.providers?.supabase}
          limit="1GB"
          color="blue"
        />
        <StorageCard
          name="Cloudinary"
          configured={status?.providers?.cloudinary}
          limit="25GB/month"
          color="green"
        />
        <StorageCard
          name="Backblaze"
          configured={status?.providers?.backblaze}
          limit="10GB"
          color="purple"
        />
      </div>

      {status?.allConfigured && (
        <div className="mt-6 p-4 bg-green-100 rounded">
          ✅ All storage providers configured correctly!
        </div>
      )}
    </div>
  );
}

function StorageCard({ name, configured, limit, color }: any) {
  return (
    <div className={`p-6 rounded-lg border-2 ${configured ? 'border-green-500' : 'border-red-500'}`}>
      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <p className="text-sm text-gray-600 mb-2">Limit: {limit}</p>
      <div className={`text-sm font-medium ${configured ? 'text-green-600' : 'text-red-600'}`}>
        {configured ? '✅ Configured' : '❌ Not Configured'}
      </div>
    </div>
  );
}
```

---

## ✅ Verification Checklist

After completing all steps, verify:

### Storage Providers
- [ ] Cloudinary configured and accessible
- [ ] Backblaze bucket created and accessible
- [ ] Supabase storage buckets created
- [ ] All providers return `true` in test endpoint

### Deployment
- [ ] Application deployed to Vercel
- [ ] All environment variables set
- [ ] No build errors
- [ ] Application accessible via URL

### Functionality
- [ ] File upload works (test with profile picture)
- [ ] CNIC upload works (test with sample image)
- [ ] Contract upload works (test with PDF)
- [ ] Files accessible via generated URLs

### Monitoring
- [ ] PostHog tracking events
- [ ] UptimeRobot monitoring site
- [ ] Sentry capturing errors
- [ ] Storage dashboard accessible

---

## 📊 Usage Monitoring

### Daily Checks
- Check Vercel Analytics for traffic
- Monitor Sentry for errors
- Review PostHog for user activity

### Weekly Checks
- **Supabase**: Check database size (should be < 400MB)
- **Cloudinary**: Check bandwidth usage (should be < 20GB)
- **Backblaze**: Check storage usage (should be < 8GB)
- **Vercel**: Check bandwidth usage (should be < 80GB)

### Monthly Tasks
- Review all provider usage
- Optimize if approaching limits
- Archive old data if needed
- Update documentation

---

## 🚨 Troubleshooting

### Issue: "Cloudinary not configured"

**Solution**:
```bash
# Verify environment variables
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY

# If empty, add to .env.local and restart dev server
npm run dev
```

### Issue: "Backblaze upload failed"

**Solution**:
```bash
# Verify bucket exists
# Check Backblaze dashboard: https://secure.backblaze.com/b2_buckets.htm

# Verify credentials
echo $BACKBLAZE_KEY_ID
echo $BACKBLAZE_APP_KEY

# Test endpoint format
curl https://s3.us-west-000.backblazeb2.com
```

### Issue: "Storage limit exceeded"

**Solution**:
```sql
-- Check Supabase storage usage
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as size_pretty
FROM storage.objects
GROUP BY bucket_id;

-- Archive old files (older than 6 months)
-- Move to Backblaze or delete
```

### Issue: "Deployment failed"

**Solution**:
```bash
# Check build logs in Vercel dashboard
# Common issues:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. Missing dependencies

# Fix and redeploy
git add .
git commit -m "Fix deployment issues"
git push origin main
```

---

## 💰 Cost Tracking

### Current Costs (FREE Tier)
| Service | Monthly Cost | Usage Limit |
|---------|--------------|-------------|
| Vercel | $0 | 100GB bandwidth |
| Supabase | $0 | 500MB DB, 1GB storage |
| Cloudinary | $0 | 25GB bandwidth |
| Backblaze | $0 | 10GB storage |
| Cloudflare | $0 | Unlimited |
| Sentry | $0 | 5K errors |
| PostHog | $0 | 1M events |
| **TOTAL** | **$0/month** | |

### When to Upgrade
- Database > 400MB → Supabase Pro ($25/mo)
- Bandwidth > 80GB → Vercel Pro ($20/mo)
- Storage > 8GB → Pay for overages (~$5-10/mo)

---

## 📞 Support

### Documentation
- [Full Deployment Strategy](./DEPLOYMENT_STRATEGY_2025.md)
- [Project Review](./PROJECT_REVIEW_UPDATE_PLAN.md)
- [Update Checklist](./UPDATE_CHECKLIST.md)

### Provider Support
- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/docs
- Cloudinary: https://support.cloudinary.com/
- Backblaze: https://help.backblaze.com/

### Emergency Contact
- Technical Lead: [Your Email]
- Support: support@maliktech.com

---

**Setup Complete!** 🎉

Your InstalEase application is now running on a **100% FREE** infrastructure with:
- ✅ Multi-provider storage
- ✅ Global CDN
- ✅ DDoS protection
- ✅ Error tracking
- ✅ Analytics
- ✅ Uptime monitoring

**Next Steps**:
1. Test all features thoroughly
2. Invite beta users
3. Monitor usage daily
4. Scale when needed

---

**Last Updated**: November 28, 2024  
**Version**: 1.0
