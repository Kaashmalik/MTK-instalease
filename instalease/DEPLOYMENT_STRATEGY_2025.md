# MTK-InstalEase Deployment Strategy 2025
## FREE → PAID Scaling Architecture

**Version**: 2.0  
**Last Updated**: November 28, 2024  
**Target**: 0-10,000+ Users

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Phase 1: Free Tier (0-100 Users)](#phase-1-free-tier-0-100-users)
3. [Phase 2: Growth Tier (100-1,000 Users)](#phase-2-growth-tier-100-1000-users)
4. [Phase 3: Scale Tier (1,000-10,000 Users)](#phase-3-scale-tier-1000-10000-users)
5. [Multi-Provider Storage Strategy](#multi-provider-storage-strategy)
6. [Implementation Guide](#implementation-guide)
7. [Cost Breakdown](#cost-breakdown)
8. [Migration Paths](#migration-paths)

---

## 🎯 Overview

This deployment strategy maximizes **FREE tier resources** while maintaining production-grade reliability and providing clear upgrade paths as your user base grows.

### Key Principles
- ✅ Start with $0 monthly cost
- ✅ Scale incrementally based on actual usage
- ✅ No vendor lock-in (multi-provider strategy)
- ✅ Production-ready from day one
- ✅ Clear migration paths between tiers

---

## 🚀 PHASE 1: FREE TIER (0-100 Users)
**Monthly Cost: $0** | **Timeline: Months 1-3**

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND & API LAYER                      │
│  Vercel Free Tier (Next.js 16 + Serverless Functions)       │
│  ✓ 100GB bandwidth  ✓ Auto SSL  ✓ CDN  ✓ Zero downtime     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SECURITY & CDN LAYER                       │
│  Cloudflare Free Tier (DDoS, WAF, Rate Limiting)            │
│  ✓ Unlimited bandwidth  ✓ SSL/TLS  ✓ 5 firewall rules      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE & AUTH LAYER                      │
│  Supabase Free Tier (PostgreSQL + Auth + Realtime)          │
│  ✓ 500MB DB  ✓ 50K MAU  ✓ 2GB bandwidth  ✓ RLS             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER (Multi-Provider)            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Supabase   │  │  Cloudinary  │  │  Backblaze   │       │
│  │   1GB Free  │  │  25GB/month  │  │   10GB Free  │       │
│  │  Profiles   │  │  CNIC Images │  │  Contracts   │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               MONITORING & OBSERVABILITY                     │
│  Sentry (5K errors)  PostHog (1M events)  UptimeRobot       │
└─────────────────────────────────────────────────────────────┘
```

### 1. Frontend & API - Vercel Free Tier

**Capabilities:**
- ✅ Next.js 16 deployment with App Router
- ✅ 100GB bandwidth per month
- ✅ Automatic SSL certificates
- ✅ Global CDN (Edge Network)
- ✅ Serverless Functions (100GB-hours/month)
- ✅ Zero downtime deployments
- ✅ Preview deployments for PRs
- ✅ Web Analytics (basic)

**Limits:**
- ⚠️ 100GB bandwidth/month
- ⚠️ 100GB-hours compute/month
- ⚠️ 6,000 build minutes/year
- ⚠️ 10 second function timeout

**Configuration:**
```bash
# vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "regions": ["sin1"],  # Singapore for Pakistan/Asia
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2. Database & Backend - Supabase Free Tier

**Capabilities:**
- ✅ 500MB PostgreSQL database
- ✅ 1GB file storage
- ✅ 2GB bandwidth per month
- ✅ 50,000 monthly active users
- ✅ 500K Edge Function invocations
- ✅ Real-time subscriptions (unlimited)
- ✅ Row Level Security (RLS)
- ✅ Built-in authentication
- ✅ Auto-generated REST APIs
- ✅ Database backups (7 days)

**Limits:**
- ⚠️ 500MB database size
- ⚠️ 1GB file storage
- ⚠️ 2GB bandwidth/month
- ⚠️ Pauses after 1 week inactivity (Pro: $25/mo removes this)

**Optimization Tips:**
```sql
-- Keep database lean
-- Archive old data after 6 months
CREATE TABLE archived_payments (LIKE payments INCLUDING ALL);

-- Add indexes for performance
CREATE INDEX idx_customers_shop_id ON customers(shop_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_installments_due_date ON installments(due_date);

-- Monitor database size
SELECT pg_size_pretty(pg_database_size('postgres'));
```

### 3. Multi-Provider Storage Strategy

#### Storage Router Implementation

Create `src/lib/storage/router.ts`:

```typescript
/**
 * Multi-Provider Storage Router
 * Routes files to optimal storage provider based on type and size
 */

export enum StorageProvider {
  SUPABASE = 'supabase',
  CLOUDINARY = 'cloudinary',
  BACKBLAZE = 'backblaze',
}

export interface StorageConfig {
  provider: StorageProvider;
  maxSize: number; // bytes
  allowedTypes: string[];
}

// Storage routing rules
export const STORAGE_RULES: Record<string, StorageConfig> = {
  profilePictures: {
    provider: StorageProvider.SUPABASE,
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  cnicImages: {
    provider: StorageProvider.CLOUDINARY,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png'],
  },
  contracts: {
    provider: StorageProvider.BACKBLAZE,
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf'],
  },
  documents: {
    provider: StorageProvider.BACKBLAZE,
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
};

export function getStorageProvider(fileType: string, fileSize: number): StorageProvider {
  // Profile pictures → Supabase
  if (fileType.includes('profile')) {
    return StorageProvider.SUPABASE;
  }
  
  // CNIC images → Cloudinary (optimization + OCR)
  if (fileType.includes('cnic')) {
    return StorageProvider.CLOUDINARY;
  }
  
  // Large files or contracts → Backblaze
  if (fileSize > 500 * 1024 || fileType.includes('contract')) {
    return StorageProvider.BACKBLAZE;
  }
  
  // Default to Supabase for small files
  return StorageProvider.SUPABASE;
}
```

#### A. Supabase Storage (1GB Free)
**Use For:** Profile pictures, avatars, small documents

```typescript
// src/lib/storage/supabase-storage.ts
import { supabase } from '@/lib/supabase/client';

export async function uploadToSupabase(
  file: File,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('customer-documents')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('customer-documents')
    .getPublicUrl(path);
    
  return publicUrl;
}
```

#### B. Cloudinary (25GB Bandwidth Free)
**Use For:** CNIC images, photos requiring optimization

**Setup:**
```bash
npm install cloudinary
```

Create `src/lib/storage/cloudinary.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(
  file: File,
  folder: string = 'instalease'
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        transformation: [
          { width: 1200, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    ).end(buffer);
  });
}

// OCR for CNIC extraction
export async function extractCNICText(imageUrl: string): Promise<string> {
  const result = await cloudinary.uploader.upload(imageUrl, {
    ocr: 'adv_ocr',
  });
  
  return result.info?.ocr?.adv_ocr?.data?.[0]?.textAnnotations?.[0]?.description || '';
}
```

#### C. Backblaze B2 (10GB Free)
**Use For:** Contracts, PDFs, long-term document storage

**Setup:**
```bash
npm install @aws-sdk/client-s3
```

Create `src/lib/storage/backblaze.ts`:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: process.env.BACKBLAZE_ENDPOINT, // e.g., https://s3.us-west-000.backblazeb2.com
  region: 'us-west-000',
  credentials: {
    accessKeyId: process.env.BACKBLAZE_KEY_ID!,
    secretAccessKey: process.env.BACKBLAZE_APP_KEY!,
  },
});

export async function uploadToBackblaze(
  file: File,
  key: string,
  bucket: string = 'instalease-contracts'
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );
  
  return `https://${bucket}.s3.us-west-000.backblazeb2.com/${key}`;
}
```

### 4. Security & CDN - Cloudflare Free Tier

**Capabilities:**
- ✅ Unlimited bandwidth
- ✅ DDoS protection
- ✅ SSL/TLS encryption
- ✅ Web Application Firewall (5 rules)
- ✅ Rate limiting (basic)
- ✅ CDN caching
- ✅ DNS management
- ✅ Page rules (3 free)

**Setup:**
1. Add domain to Cloudflare
2. Update nameservers
3. Enable "Always Use HTTPS"
4. Set up page rules:
   - Cache static assets
   - Rate limit API endpoints
   - Redirect www to non-www

**Cloudflare Configuration:**
```javascript
// Rate limiting rule (via Cloudflare dashboard)
{
  "expression": "(http.request.uri.path contains \"/api/\")",
  "action": "challenge",
  "characteristics": ["ip.src"],
  "period": 60,
  "requests_per_period": 100
}
```

### 5. Monitoring & Observability (FREE)

#### A. Sentry (5,000 Errors/Month Free)
```bash
# Already configured in project
NEXT_PUBLIC_SENTRY_DSN=your_dsn
```

#### B. PostHog (1M Events/Month Free)
**Setup:**
```bash
npm install posthog-js
```

Create `src/lib/analytics/posthog.ts`:

```typescript
import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: 'https://app.posthog.com',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.opt_out_capturing();
      },
    });
  }
}

export { posthog };
```

#### C. UptimeRobot (50 Monitors Free)
- Monitor: https://instalease.vercel.app
- Check interval: 5 minutes
- Alert via: Email, SMS (limited)

#### D. Better Stack Logs (1GB/Month Free)
**Setup:**
```bash
npm install @logtail/node @logtail/next
```

### 6. Communication Services

#### A. Twilio (Free Trial: $15.50 Credit)
```javascript
// ~100 SMS messages in Pakistan
// SMS cost: ~$0.12 per message
// WhatsApp: ~$0.30 per message

// Optimize usage:
const sendSMS = async (to: string, message: string) => {
  // Only send critical notifications
  if (isCriticalNotification(message)) {
    await twilioClient.messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: message,
    });
  }
};
```

#### B. Email - Gmail SMTP (500 Emails/Day Free)
```javascript
// Already configured in project
// Upgrade to G Suite ($6/user/month) for 2,000 emails/day
```

### 7. Payment Gateways (Sandbox - FREE)

```javascript
// Use sandbox/test environments
const PAYMENT_CONFIG = {
  jazzcash: {
    mode: 'sandbox', // Free testing
    merchantId: process.env.JAZZCASH_SANDBOX_MERCHANT_ID,
  },
  easypaisa: {
    mode: 'test', // Free testing
    storeId: process.env.EASYPAISA_TEST_STORE_ID,
  },
  raast: {
    mode: 'sandbox', // Free testing
    apiUrl: 'https://sandbox.raast.bank.com',
  },
};
```

---

## 📈 PHASE 2: GROWTH TIER (100-1,000 Users)
**Monthly Cost: ~$50-100** | **Timeline: Months 4-12**

### When to Upgrade
- ⚠️ Approaching 500MB database size
- ⚠️ Exceeding 100GB Vercel bandwidth
- ⚠️ Need 24/7 uptime (Supabase pausing)
- ⚠️ Require better support

### Upgrade Path

#### 1. Supabase Pro ($25/month)
**Benefits:**
- ✅ 8GB database (16x increase)
- ✅ 100GB file storage (100x increase)
- ✅ 250GB bandwidth
- ✅ No pausing
- ✅ 7-day Point-in-Time Recovery
- ✅ Daily backups
- ✅ Email support

#### 2. Vercel Pro ($20/month)
**Benefits:**
- ✅ 1TB bandwidth (10x increase)
- ✅ 1,000GB-hours compute
- ✅ Password protection
- ✅ Analytics
- ✅ Team collaboration

#### 3. Cloudinary Pro ($89/month) - Optional
**Only if:**
- Processing >25GB images/month
- Need advanced transformations
- Require video processing

**Alternative:** Stay on free tier + use Backblaze for overflow

#### 4. Better Stack Pro ($20/month) - Optional
**Benefits:**
- ✅ 10GB logs/month
- ✅ 30-day retention
- ✅ Advanced search

### Cost Optimization Tips

```javascript
// Implement aggressive caching
export const revalidate = 3600; // 1 hour

// Use ISR for static content
export async function generateStaticParams() {
  // Pre-render popular pages
}

// Optimize images
import Image from 'next/image';
<Image
  src={url}
  width={800}
  height={600}
  quality={75}
  loading="lazy"
/>
```

---

## 🚀 PHASE 3: SCALE TIER (1,000-10,000 Users)
**Monthly Cost: ~$200-500** | **Timeline: Year 2+**

### Infrastructure Upgrades

#### 1. Database - Supabase Team ($599/month)
- ✅ 256GB database
- ✅ 1TB bandwidth
- ✅ 99.9% SLA
- ✅ Priority support

**Alternative:** Self-hosted PostgreSQL on DigitalOcean
- Managed PostgreSQL: $15-120/month
- More control, requires DevOps

#### 2. CDN & Security - Cloudflare Pro ($20/month)
- ✅ Advanced DDoS protection
- ✅ 20 page rules
- ✅ Mobile optimization
- ✅ Image optimization

#### 3. Compute - Vercel Enterprise (Custom)
**Or migrate to:**
- AWS Amplify
- Railway
- Fly.io
- Self-hosted on DigitalOcean

#### 4. Storage - Dedicated Backblaze ($5-50/month)
- Pay per GB: $0.005/GB/month
- Bandwidth: $0.01/GB

---

## 💾 Multi-Provider Storage Strategy

### Implementation Checklist

- [ ] Create storage router (`src/lib/storage/router.ts`)
- [ ] Implement Cloudinary integration
- [ ] Implement Backblaze B2 integration
- [ ] Update file upload components
- [ ] Add storage provider selection logic
- [ ] Implement fallback mechanisms
- [ ] Add storage usage monitoring
- [ ] Document storage limits

### File Type Routing Table

| File Type | Size | Provider | Free Limit | Cost After |
|-----------|------|----------|------------|------------|
| Profile pics | <2MB | Supabase | 1GB total | $0.021/GB |
| CNIC images | <5MB | Cloudinary | 25GB/mo | $0.10/GB |
| Contracts | <10MB | Backblaze | 10GB | $0.005/GB |
| Documents | <10MB | Backblaze | 10GB | $0.005/GB |
| Signatures | <1MB | Supabase | 1GB total | $0.021/GB |

### Storage Monitoring

Create `src/lib/storage/monitor.ts`:

```typescript
export async function getStorageUsage() {
  const supabaseUsage = await getSupabaseStorageSize();
  const cloudinaryUsage = await getCloudinaryUsage();
  const backblazeUsage = await getBackblazeUsage();
  
  return {
    supabase: {
      used: supabaseUsage,
      limit: 1024 * 1024 * 1024, // 1GB
      percentage: (supabaseUsage / (1024 * 1024 * 1024)) * 100,
    },
    cloudinary: {
      used: cloudinaryUsage,
      limit: 25 * 1024 * 1024 * 1024, // 25GB/month
      percentage: (cloudinaryUsage / (25 * 1024 * 1024 * 1024)) * 100,
    },
    backblaze: {
      used: backblazeUsage,
      limit: 10 * 1024 * 1024 * 1024, // 10GB
      percentage: (backblazeUsage / (10 * 1024 * 1024 * 1024)) * 100,
    },
  };
}
```

---

## 🛠️ Implementation Guide

### Step 1: Update Environment Variables

Add to `.env.local` and Vercel:

```bash
# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Backblaze B2
BACKBLAZE_ENDPOINT=https://s3.us-west-000.backblazeb2.com
BACKBLAZE_KEY_ID=your_key_id
BACKBLAZE_APP_KEY=your_app_key
BACKBLAZE_BUCKET=instalease-contracts

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key

# Better Stack Logs
LOGTAIL_SOURCE_TOKEN=your_logtail_token
```

### Step 2: Install Dependencies

```bash
npm install cloudinary @aws-sdk/client-s3 posthog-js @logtail/next
```

### Step 3: Update Storage Implementation

Replace `src/lib/supabase/storage.ts` with multi-provider version:

```typescript
// Import all storage providers
import { uploadToSupabase } from './storage/supabase-storage';
import { uploadToCloudinary } from './storage/cloudinary';
import { uploadToBackblaze } from './storage/backblaze';
import { getStorageProvider, StorageProvider } from './storage/router';

export async function uploadFile(
  file: File,
  fileType: string
): Promise<string> {
  const provider = getStorageProvider(fileType, file.size);
  
  switch (provider) {
    case StorageProvider.CLOUDINARY:
      return uploadToCloudinary(file, fileType);
    
    case StorageProvider.BACKBLAZE:
      return uploadToBackblaze(file, `${fileType}/${Date.now()}_${file.name}`);
    
    case StorageProvider.SUPABASE:
    default:
      return uploadToSupabase(file, `${fileType}/${Date.now()}_${file.name}`);
  }
}
```

### Step 4: Update Customer Form

Modify `src/components/customers/CustomerForm.tsx`:

```typescript
// Update CNIC upload to use Cloudinary
const handleCNICUpload = async (file: File, type: 'front' | 'back') => {
  try {
    const url = await uploadFile(file, `cnic_${type}`);
    
    // Optional: Extract text from CNIC using Cloudinary OCR
    if (type === 'front') {
      const extractedText = await extractCNICText(url);
      // Parse and pre-fill form fields
    }
    
    return url;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
```

### Step 5: Set Up Monitoring Dashboard

Create `src/app/admin/storage/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getStorageUsage } from '@/lib/storage/monitor';

export default function StorageMonitorPage() {
  const [usage, setUsage] = useState(null);
  
  useEffect(() => {
    getStorageUsage().then(setUsage);
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Storage Usage</h1>
      
      {usage && (
        <div className="grid grid-cols-3 gap-4">
          <StorageCard
            provider="Supabase"
            usage={usage.supabase}
            color="blue"
          />
          <StorageCard
            provider="Cloudinary"
            usage={usage.cloudinary}
            color="green"
          />
          <StorageCard
            provider="Backblaze"
            usage={usage.backblaze}
            color="purple"
          />
        </div>
      )}
    </div>
  );
}
```

### Step 6: Configure Cloudflare

1. **Add Domain to Cloudflare**
   - Go to Cloudflare Dashboard
   - Add site: `instalease.com`
   - Update nameservers at domain registrar

2. **SSL/TLS Settings**
   - SSL/TLS → Overview → Full (strict)
   - Edge Certificates → Always Use HTTPS: ON
   - Minimum TLS Version: 1.2

3. **Page Rules** (3 free)
   ```
   Rule 1: *instalease.com/api/*
   - Cache Level: Bypass
   - Security Level: High
   
   Rule 2: *instalease.com/_next/static/*
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month
   
   Rule 3: www.instalease.com/*
   - Forwarding URL: 301 to https://instalease.com/$1
   ```

4. **Firewall Rules** (5 free)
   ```javascript
   // Rate limiting for API
   (http.request.uri.path contains "/api/" and 
    rate.requests.per.minute > 100)
   
   // Block known bad bots
   (cf.client.bot) and not (cf.verified_bot)
   
   // Geo-blocking (optional)
   (ip.geoip.country ne "PK" and 
    http.request.uri.path contains "/admin")
   ```

### Step 7: Deploy & Test

```bash
# 1. Commit changes
git add .
git commit -m "Implement multi-provider storage strategy"

# 2. Push to GitHub (triggers auto-deploy)
git push origin main

# 3. Verify deployment
npm run verify:production

# 4. Test storage providers
# - Upload profile picture (should use Supabase)
# - Upload CNIC (should use Cloudinary)
# - Upload contract (should use Backblaze)

# 5. Monitor usage
# - Check Supabase dashboard
# - Check Cloudinary dashboard
# - Check Backblaze dashboard
```

---

## 💰 Cost Breakdown

### Phase 1: FREE Tier (0-100 Users)

| Service | Free Tier | Monthly Cost |
|---------|-----------|--------------|
| Vercel | 100GB bandwidth | $0 |
| Supabase | 500MB DB + 1GB storage | $0 |
| Cloudinary | 25GB bandwidth | $0 |
| Backblaze | 10GB storage | $0 |
| Cloudflare | Unlimited bandwidth | $0 |
| Sentry | 5K errors | $0 |
| PostHog | 1M events | $0 |
| UptimeRobot | 50 monitors | $0 |
| Better Stack | 1GB logs | $0 |
| **TOTAL** | | **$0/month** |

### Phase 2: Growth Tier (100-1,000 Users)

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| Cloudinary | Free (or Pro if needed) | $0-89 |
| Backblaze | Pay-as-you-go | $5-20 |
| Cloudflare | Free | $0 |
| Sentry | Team | $26 |
| PostHog | Free | $0 |
| Better Stack | Pro (optional) | $0-20 |
| **TOTAL** | | **$76-180/month** |

### Phase 3: Scale Tier (1,000-10,000 Users)

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Vercel | Pro/Enterprise | $20-200 |
| Supabase | Team | $599 |
| Cloudinary | Advanced | $224 |
| Backblaze | Pay-as-you-go | $20-100 |
| Cloudflare | Pro | $20 |
| Sentry | Business | $80 |
| PostHog | Scale | $0-200 |
| **TOTAL** | | **$963-1,423/month** |

---

## 🔄 Migration Paths

### When to Migrate

#### From Free to Growth
**Triggers:**
- Database >400MB (80% of 500MB)
- Bandwidth >80GB/month (80% of 100GB)
- Supabase pausing due to inactivity
- Need better support

**Migration Steps:**
1. Upgrade Supabase to Pro ($25/mo)
2. Upgrade Vercel to Pro ($20/mo)
3. Monitor usage for 1 month
4. Optimize if needed

#### From Growth to Scale
**Triggers:**
- Database >6GB (75% of 8GB)
- Bandwidth >750GB/month
- Need 99.9% SLA
- Require advanced features

**Migration Steps:**
1. Evaluate self-hosting options
2. Consider database sharding
3. Implement read replicas
4. Set up load balancing

### Database Migration Strategy

```sql
-- Archive old data to reduce database size
-- Run monthly

-- 1. Create archive tables
CREATE TABLE IF NOT EXISTS archived_payments_2024 (LIKE payments INCLUDING ALL);
CREATE TABLE IF NOT EXISTS archived_contracts_2024 (LIKE contracts INCLUDING ALL);

-- 2. Move old data
INSERT INTO archived_payments_2024
SELECT * FROM payments
WHERE created_at < NOW() - INTERVAL '6 months';

-- 3. Delete archived data from main table
DELETE FROM payments
WHERE created_at < NOW() - INTERVAL '6 months';

-- 4. Vacuum to reclaim space
VACUUM FULL payments;

-- 5. Verify database size
SELECT pg_size_pretty(pg_database_size('postgres'));
```

---

## 📊 Monitoring & Alerts

### Set Up Alerts

#### 1. Storage Usage Alerts

Create `src/lib/monitoring/alerts.ts`:

```typescript
export async function checkStorageLimits() {
  const usage = await getStorageUsage();
  
  // Alert if any provider >80% usage
  Object.entries(usage).forEach(([provider, data]) => {
    if (data.percentage > 80) {
      sendAlert({
        type: 'storage_warning',
        provider,
        usage: data.percentage,
        message: `${provider} storage at ${data.percentage.toFixed(1)}%`,
      });
    }
  });
}

// Run daily via cron job or Vercel Cron
```

#### 2. Database Size Monitoring

```sql
-- Create monitoring view
CREATE OR REPLACE VIEW database_size_monitor AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- Query to check
SELECT * FROM database_size_monitor;
```

#### 3. Bandwidth Monitoring

```javascript
// Add to Vercel Analytics
// Monitor via dashboard: vercel.com/[team]/[project]/analytics

// Or use Cloudflare Analytics
// Dashboard → Analytics & Logs → Traffic
```

---

## 🎯 Best Practices

### 1. Cost Optimization

```typescript
// Implement aggressive caching
export const revalidate = 3600; // 1 hour for static data
export const dynamic = 'force-static'; // For truly static pages

// Use ISR for semi-static content
export async function generateStaticParams() {
  const shops = await getShops();
  return shops.map((shop) => ({ id: shop.id }));
}

// Optimize images
import Image from 'next/image';
<Image
  src={imageUrl}
  width={800}
  height={600}
  quality={75}
  loading="lazy"
  placeholder="blur"
/>
```

### 2. Database Optimization

```sql
-- Add appropriate indexes
CREATE INDEX CONCURRENTLY idx_customers_shop_created 
ON customers(shop_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_contracts_status_shop 
ON contracts(status, shop_id) WHERE status != 'completed';

-- Use partial indexes for common queries
CREATE INDEX CONCURRENTLY idx_pending_installments 
ON installments(due_date, contract_id) 
WHERE status = 'pending';

-- Monitor slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 3. Storage Optimization

```typescript
// Compress images before upload
import imageCompression from 'browser-image-compression';

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  
  return await imageCompression(file, options);
}

// Clean up old files
async function cleanupOldFiles() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  // Archive or delete files older than 6 months
  // Implement based on your retention policy
}
```

### 4. API Optimization

```typescript
// Implement request batching
export async function batchFetchContracts(ids: string[]) {
  // Fetch multiple contracts in one query
  const { data } = await supabase
    .from('contracts')
    .select('*')
    .in('id', ids);
    
  return data;
}

// Use React Query for caching
import { useQuery } from '@tanstack/react-query';

export function useContracts(shopId: string) {
  return useQuery({
    queryKey: ['contracts', shopId],
    queryFn: () => fetchContracts(shopId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

---

## 🚨 Troubleshooting

### Issue: Supabase Pausing

**Solution:**
```bash
# Option 1: Upgrade to Pro ($25/mo) - Recommended
# Option 2: Set up cron job to ping database every 6 days

# Create Vercel Cron (vercel.json)
{
  "crons": [
    {
      "path": "/api/cron/keep-alive",
      "schedule": "0 0 */5 * *"
    }
  ]
}

# Create API route: src/app/api/cron/keep-alive/route.ts
export async function GET() {
  await supabase.from('shops').select('count').single();
  return Response.json({ status: 'ok' });
}
```

### Issue: Storage Limit Exceeded

**Solution:**
```typescript
// Implement automatic cleanup
async function archiveOldFiles() {
  // Move files older than 6 months to Backblaze
  // Delete from Supabase/Cloudinary
  
  const oldFiles = await getFilesOlderThan(6, 'months');
  
  for (const file of oldFiles) {
    // Upload to Backblaze
    await uploadToBackblaze(file);
    
    // Delete from original provider
    await deleteFromOriginalProvider(file);
  }
}
```

### Issue: Bandwidth Exceeded

**Solution:**
```typescript
// Implement CDN caching
// Add to next.config.ts
export default {
  images: {
    domains: ['your-domain.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // Enable static optimization
  output: 'standalone',
};

// Use Cloudflare caching
// Set cache headers in API routes
export async function GET() {
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Storage providers set up (Cloudinary, Backblaze)
- [ ] Cloudflare configured
- [ ] Monitoring tools configured (Sentry, PostHog)
- [ ] Database migrations applied
- [ ] Tests passing

### Deployment
- [ ] Deploy to Vercel
- [ ] Verify all services connected
- [ ] Test file uploads (all providers)
- [ ] Test payment flows (sandbox)
- [ ] Test real-time features
- [ ] Verify monitoring working

### Post-Deployment
- [ ] Set up uptime monitoring
- [ ] Configure alerts
- [ ] Document any issues
- [ ] Monitor logs for 24 hours
- [ ] Verify backup strategy

---

## 📞 Support & Resources

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Backblaze B2 Docs](https://www.backblaze.com/b2/docs/)
- [Cloudflare Docs](https://developers.cloudflare.com/)

### Community
- [Supabase Discord](https://discord.supabase.com)
- [Next.js Discord](https://nextjs.org/discord)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

### Emergency Contacts
- **Technical Lead**: [Your Email]
- **DevOps**: [DevOps Email]
- **Support**: support@maliktech.com

---

**Last Updated**: November 28, 2024  
**Next Review**: December 28, 2024  
**Version**: 2.0
