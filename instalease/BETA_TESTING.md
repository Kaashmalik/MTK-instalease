# InstalEase Beta Testing Guide

This guide helps you set up and manage beta testing for InstalEase.

## Table of Contents

1. [Beta Testing Overview](#beta-testing-overview)
2. [Pre-Beta Checklist](#pre-beta-checklist)
3. [Inviting Beta Testers](#inviting-beta-testers)
4. [Beta Testing Scripts](#beta-testing-scripts)
5. [Feedback Collection](#feedback-collection)
6. [Monitoring Beta Usage](#monitoring-beta-usage)
7. [Beta Testing Scenarios](#beta-testing-scenarios)

## Beta Testing Overview

Beta testing allows you to:
- Test the application with real users
- Gather feedback before full launch
- Identify bugs and usability issues
- Validate core features
- Build early user base

## Pre-Beta Checklist

Before inviting beta testers:

- [ ] Application deployed to production
- [ ] All critical features functional
- [ ] Error tracking (Sentry) configured
- [ ] Analytics enabled
- [ ] Database backups configured
- [ ] Support channel established (email/Slack)
- [ ] Beta testing documentation ready
- [ ] Feedback collection system in place
- [ ] Known issues documented

## Inviting Beta Testers

### Option 1: Manual Invitation Script

Create a script to invite users:

```bash
# scripts/invite-beta-user.sh
#!/bin/bash

EMAIL=$1
ROLE=$2  # shop_owner, sales_rep, credit_manager

if [ -z "$EMAIL" ] || [ -z "$ROLE" ]; then
  echo "Usage: ./invite-beta-user.sh <email> <role>"
  exit 1
fi

# Use Supabase Admin API or direct database access
# This is a template - implement based on your auth system

echo "Inviting $EMAIL as $ROLE..."
# Add invitation logic here
```

### Option 2: Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter email and set role
4. User receives invitation email

### Option 3: Self-Service Signup

1. Enable public signup in Supabase
2. Provide signup link to beta testers
3. Manually approve and assign roles

### Beta Tester Roles

- **Shop Owners**: Primary users, test full functionality
- **Sales Reps**: Test application workflow
- **Credit Managers**: Test approval process
- **Customers**: Test customer portal (optional)

## Beta Testing Scripts

### Script 1: Generate Beta Invitation Links

```typescript
// scripts/generate-invitations.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BetaInvitation {
  email: string;
  role: string;
  shopId?: string;
}

async function generateInvitations(invitations: BetaInvitation[]) {
  const results = [];
  
  for (const invite of invitations) {
    try {
      // Create user
      const { data: user, error } = await supabase.auth.admin.createUser({
        email: invite.email,
        email_confirm: true,
        user_metadata: {
          role: invite.role,
          beta_tester: true,
        },
      });
      
      if (error) throw error;
      
      // Assign to shop if provided
      if (invite.shopId && user.user) {
        await supabase
          .from('user_shops')
          .insert({
            user_id: user.user.id,
            shop_id: invite.shopId,
            role: invite.role,
          });
      }
      
      results.push({ email: invite.email, status: 'success', userId: user.user?.id });
    } catch (error) {
      results.push({ email: invite.email, status: 'error', error: error.message });
    }
  }
  
  return results;
}

// Usage
const invitations = [
  { email: 'shopowner@example.com', role: 'shop_owner' },
  { email: 'salesrep@example.com', role: 'sales_rep', shopId: 'shop-id' },
];

generateInvitations(invitations).then(console.log);
```

### Script 2: Beta Tester Analytics

```typescript
// scripts/beta-analytics.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getBetaTesterStats() {
  // Get all beta testers
  const { data: betaTesters } = await supabase
    .from('users')
    .select('*')
    .eq('user_metadata->>beta_tester', 'true');
  
  // Get activity stats
  const stats = {
    totalTesters: betaTesters?.length || 0,
    activeTesters: 0,
    contractsCreated: 0,
    paymentsProcessed: 0,
    issuesReported: 0,
  };
  
  // Calculate active testers (logged in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  for (const tester of betaTesters || []) {
    if (new Date(tester.last_sign_in_at) > sevenDaysAgo) {
      stats.activeTesters++;
    }
  }
  
  // Get contract and payment stats
  const { count: contracts } = await supabase
    .from('contracts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString());
  
  const { count: payments } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString());
  
  stats.contractsCreated = contracts || 0;
  stats.paymentsProcessed = payments || 0;
  
  return stats;
}

getBetaTesterStats().then(console.log);
```

## Feedback Collection

### Method 1: In-App Feedback Form

Create a feedback component:

```typescript
// src/components/FeedbackForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function FeedbackForm() {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Send to your feedback collection system
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    });
    
    setSubmitted(true);
  };
  
  if (submitted) {
    return <div>Thank you for your feedback!</div>;
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Share your feedback..."
      />
      <Button type="submit">Submit Feedback</Button>
    </form>
  );
}
```

### Method 2: External Feedback Tools

- **Typeform**: Create feedback forms
- **Google Forms**: Simple feedback collection
- **UserVoice**: Feature requests and feedback
- **Canny**: Product feedback management

### Method 3: Email/Slack Channel

- Create dedicated email: beta-feedback@instalease.com
- Set up Slack channel: #beta-feedback
- Monitor and respond promptly

## Monitoring Beta Usage

### 1. Sentry Error Tracking

Monitor errors in Sentry:
- Filter by environment: `environment:production`
- Tag beta testers: `beta_tester:true`
- Set up alerts for critical errors

### 2. Supabase Analytics

Monitor database usage:
- Active users
- API requests
- Database performance
- Storage usage

### 3. Vercel Analytics

Track:
- Page views
- User sessions
- Performance metrics
- Geographic distribution

### 4. Custom Analytics Dashboard

Create dashboard to track:
- Daily active users
- Feature usage
- Error rates
- User satisfaction scores

## Beta Testing Scenarios

### Scenario 1: Shop Owner Onboarding

**Steps:**
1. Sign up as shop owner
2. Complete shop profile
3. Add first customer
4. Create first contract
5. Process test payment
6. View dashboard analytics

**Expected Outcomes:**
- Smooth onboarding flow
- Clear instructions
- No errors during setup

### Scenario 2: Sales Rep Workflow

**Steps:**
1. Login as sales rep
2. View applications panel
3. Create new application
4. Submit for approval
5. Track application status

**Expected Outcomes:**
- Easy application creation
- Clear status indicators
- Proper role restrictions

### Scenario 3: Payment Processing

**Steps:**
1. Create contract with installments
2. Process payment via JazzCash
3. Verify payment recorded
4. Check customer balance updated
5. View payment history

**Expected Outcomes:**
- Payment processes successfully
- Callback received correctly
- Balance updates immediately
- History displays accurately

### Scenario 4: Customer Portal

**Steps:**
1. Access customer portal
2. View outstanding balance
3. Check upcoming installments
4. View payment history
5. Review contract details

**Expected Outcomes:**
- Portal accessible
- Data accurate
- UI intuitive
- Mobile responsive

### Scenario 5: Real-Time Updates

**Steps:**
1. Open dashboard
2. Process payment in another tab
3. Verify dashboard updates automatically
4. Check notifications appear

**Expected Outcomes:**
- Real-time updates work
- No page refresh needed
- Notifications timely

## Beta Testing Checklist

### For Each Beta Tester

- [ ] Account created and activated
- [ ] Welcome email sent
- [ ] Onboarding guide provided
- [ ] Support channel access granted
- [ ] Initial feedback requested after 3 days
- [ ] Follow-up after 1 week
- [ ] Final feedback before beta ends

### Weekly Reviews

- [ ] Review error logs
- [ ] Analyze usage statistics
- [ ] Collect and prioritize feedback
- [ ] Address critical bugs
- [ ] Update beta testers on progress

## Beta Testing Timeline

### Week 1: Initial Testing
- Invite 5-10 beta testers
- Focus on core features
- Collect initial feedback
- Fix critical bugs

### Week 2-3: Expanded Testing
- Invite 20-30 more testers
- Test edge cases
- Gather feature requests
- Improve UX based on feedback

### Week 4: Final Testing
- Invite remaining testers
- Test at scale
- Final bug fixes
- Prepare for launch

## Beta Tester Communication

### Welcome Email Template

```
Subject: Welcome to InstalEase Beta!

Hi [Name],

Thank you for joining the InstalEase beta program!

Your account is ready:
- Login: https://instalease.vercel.app/auth/login
- Email: [email]
- Role: [role]

Getting Started:
1. Complete your profile
2. Explore the dashboard
3. Create your first contract
4. Share your feedback

Support:
- Email: beta-support@instalease.com
- Documentation: [link]
- Feedback Form: [link]

We're excited to have you on board!

The InstalEase Team
```

### Weekly Update Template

```
Subject: InstalEase Beta - Week [X] Update

Hi Beta Testers,

Here's what's new this week:

Updates:
- [Feature 1]
- [Bug fix 1]
- [Improvement 1]

Known Issues:
- [Issue 1] - Working on it
- [Issue 2] - Fixed in next update

Feedback Highlights:
- [Feedback 1] - Implemented
- [Feedback 2] - In progress

Thank you for your continued testing!

The InstalEase Team
```

## Support Resources

- **Documentation**: [README.md](./README.md)
- **Known Issues**: GitHub Issues
- **Feature Requests**: Feedback form
- **Support Email**: beta-support@instalease.com

---

**Version**: 1.0.0-beta
**Last Updated**: Phase 4

