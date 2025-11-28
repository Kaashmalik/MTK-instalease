# InstalEase - Quick Update Checklist
**Date**: November 28, 2024

This is a quick-reference checklist for updating the InstalEase project. For detailed information, see `PROJECT_REVIEW_UPDATE_PLAN.md`.

---

## 🚨 Critical Updates (Do First)

### 1. Update Core Dependencies
```bash
# Update critical packages
npm update next @supabase/supabase-js @sentry/nextjs @playwright/test

# Verify installation
npm list next @supabase/supabase-js @sentry/nextjs
```

**Expected Updates:**
- ✅ next: 16.0.3 → 16.0.5
- ✅ @supabase/supabase-js: 2.84.0 → 2.86.0
- ✅ @sentry/nextjs: 10.26.0 → 10.27.0
- ✅ @playwright/test: 1.56.1 → 1.57.0

### 2. Security Audit
```bash
# Check for vulnerabilities
npm audit

# Fix automatically (review changes)
npm audit fix

# If needed (review breaking changes first)
npm audit fix --force
```

### 3. Test Everything
```bash
# Run all tests
npm run lint
npm test
npm run test:e2e

# Build for production
npm run build

# Test production build locally
npm start
```

---

## 🔧 Code Fixes (Quick Wins)

### Fix 1: ErrorBoundary Sentry Integration
**File**: `src/components/ErrorBoundary.tsx`
**Line**: 78
**Current**:
```typescript
// TODO: Log to error tracking service (e.g., Sentry) in production
// logErrorToService(error, errorInfo);
```

**Action**: Replace with:
```typescript
// Log to Sentry in production
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  });
}
```

**Don't forget to import Sentry**:
```typescript
import * as Sentry from '@sentry/nextjs';
```

---

## 📝 Documentation Updates

### Update README.md
- [ ] Verify all links work
- [ ] Update version number to current
- [ ] Add any new features
- [ ] Update screenshots if UI changed

### Update CHANGELOG.md
- [ ] Add entry for any bug fixes
- [ ] Document dependency updates
- [ ] Note any breaking changes

---

## 🧪 Testing Tasks

### E2E Test Setup
**File**: `e2e/customer-workflow.spec.ts`

1. **Create Test Users in Supabase**
   ```sql
   -- Run in Supabase SQL Editor
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
   VALUES ('test@example.com', crypt('TestPassword123!', gen_salt('bf')), NOW());
   ```

2. **Update Test File**
   - Remove TODO comment
   - Add proper authentication flow
   - Test customer workflows

3. **Run Tests**
   ```bash
   npm run test:e2e
   npm run test:e2e:ui  # Interactive mode
   ```

---

## 🔒 Security Tasks

### Environment Variables Check
```bash
# Verify all required variables are set
cat .env.local | grep -E "SUPABASE|SENTRY|TWILIO|SMTP"
```

**Required Variables:**
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ NEXT_PUBLIC_SENTRY_DSN (production)
- ✅ TWILIO_* (if using SMS)
- ✅ SMTP_* (if using email)

### Key Rotation Schedule
- [ ] Supabase keys: Every 90 days
- [ ] Payment gateway keys: Every 180 days
- [ ] Twilio keys: Every 90 days
- [ ] Sentry auth token: Every 180 days

---

## 📊 Performance Checks

### Database Optimization
```sql
-- Check slow queries in Supabase Dashboard
-- Add indexes for frequently queried columns

-- Example: Add index for customer lookups
CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_installments_contract_id ON installments(contract_id);
```

### Frontend Optimization
- [ ] Review bundle size: `npm run build` (check output)
- [ ] Check for unused dependencies: `npx depcheck`
- [ ] Optimize images (use Next.js Image component)
- [ ] Add loading states for async operations

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Build succeeds locally
- [ ] Environment variables configured in Vercel
- [ ] Database migrations applied
- [ ] Sentry configured

### Deployment
```bash
# Using Vercel CLI
vercel --prod

# Or push to main branch (auto-deploy via GitHub Actions)
git push origin main
```

### Post-Deployment
- [ ] Verify site is accessible
- [ ] Check Sentry for errors
- [ ] Test critical user flows
- [ ] Monitor performance metrics
- [ ] Run production verification: `npm run verify:production`

---

## 📈 Monitoring Setup

### Sentry Alerts
1. Go to Sentry Dashboard
2. Set up alerts for:
   - Error rate > 1%
   - New error types
   - Performance degradation

### Vercel Analytics
1. Enable in Vercel Dashboard
2. Monitor:
   - Page load times
   - API response times
   - Error rates

### Supabase Monitoring
1. Check Database Health
2. Monitor API usage
3. Review slow queries
4. Check connection pool

---

## 🔄 Regular Maintenance

### Daily
- [ ] Check Sentry for new errors
- [ ] Monitor Vercel deployment status
- [ ] Review user feedback

### Weekly
- [ ] Run `npm audit`
- [ ] Review performance metrics
- [ ] Check database health
- [ ] Update dependencies (patch versions)

### Monthly
- [ ] Update all dependencies
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation review
- [ ] Load testing

### Quarterly
- [ ] Rotate API keys
- [ ] Major version updates
- [ ] Feature planning
- [ ] Comprehensive load testing

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Tests Fail
```bash
# Update test snapshots
npm test -- -u

# Run specific test
npm test -- ErrorBoundary.test.ts
```

### Deployment Issues
```bash
# Check Vercel logs
vercel logs

# Verify environment variables
vercel env ls
```

### Database Issues
- Check Supabase Dashboard → Logs
- Verify RLS policies are correct
- Check connection pool settings
- Review slow query logs

---

## 📞 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com
- **Sentry Dashboard**: https://sentry.io
- **GitHub Repo**: https://github.com/Malik-Tech-company/instalease
- **Documentation**: See `README.md`, `DEPLOYMENT.md`, `SECURITY_AUDIT.md`

---

## ✅ Completion Checklist

### Phase 1: Critical Updates (This Week)
- [ ] Update core dependencies
- [ ] Run security audit
- [ ] Fix ErrorBoundary TODO
- [ ] Test everything
- [ ] Deploy to production

### Phase 2: Testing & Docs (Next Week)
- [ ] Complete E2E tests
- [ ] Update documentation
- [ ] Add API documentation
- [ ] Set up monitoring alerts

### Phase 3: Optimization (This Month)
- [ ] Add database indexes
- [ ] Implement code splitting
- [ ] Add rate limiting
- [ ] Performance optimization

---

**Status**: Ready for updates
**Last Updated**: November 28, 2024
**Next Review**: December 5, 2024
