# Real-Time Configuration Setup Guide

This guide provides comprehensive instructions for setting up and configuring real-time features in InstalEase using Supabase Realtime.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Supabase Dashboard Configuration](#supabase-dashboard-configuration)
4. [Database Setup](#database-setup)
5. [Environment Variables](#environment-variables)
6. [Client Configuration](#client-configuration)
7. [Using Real-Time Hooks](#using-real-time-hooks)
8. [Advanced Configuration](#advanced-configuration)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)
11. [Security Considerations](#security-considerations)

---

## Overview

InstalEase uses **Supabase Realtime** to provide live updates for:

- **Payments**: Real-time payment status updates
- **Contracts**: Live contract status changes
- **Installments**: Instant installment payment updates
- **Dashboard**: Live statistics and metrics

Real-time features enable:
- Instant UI updates when data changes
- Multi-user collaboration without page refreshes
- Live notifications for important events
- Real-time dashboard statistics

---

## Prerequisites

Before setting up real-time features, ensure you have:

1. ✅ **Supabase Account**: Active Supabase project
2. ✅ **Database Tables**: All required tables created (see migrations)
3. ✅ **RLS Policies**: Row Level Security enabled and configured
4. ✅ **Node.js v18+**: For running the application
5. ✅ **Environment Variables**: Supabase credentials configured

---

## Supabase Dashboard Configuration

### Step 1: Enable Realtime

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Scroll to the **Realtime** section
5. Toggle **Enable Realtime** to **ON**
6. Click **Save**

### Step 2: Enable Realtime for Specific Tables

Realtime must be enabled for each table you want to monitor:

1. Go to **Database** → **Tables**
2. Select a table (e.g., `payments`, `contracts`, `installments`)
3. Click on the table name to open details
4. Go to the **Realtime** tab
5. Toggle **Enable Realtime** to **ON**
6. Repeat for all tables that need real-time updates:
   - `payments`
   - `contracts`
   - `installments`
   - `customers` (optional)
   - `guarantors` (optional)

### Step 3: Configure Realtime Publication

Supabase uses PostgreSQL's logical replication. Verify the publication is enabled:

1. Go to **Database** → **Replication**
2. Ensure `supabase_realtime` publication exists
3. If not, run this SQL in the SQL Editor:

```sql
-- Create publication if it doesn't exist
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- Or for specific tables only:
CREATE PUBLICATION supabase_realtime FOR TABLE payments, contracts, installments;
```

### Step 4: Verify Realtime Status

1. Go to **Database** → **Replication**
2. Check that replication slots are active
3. Verify no errors in the replication status

---

## Database Setup

### Enable Realtime via SQL (Alternative Method)

If you prefer SQL, you can enable realtime for tables directly:

```sql
-- Enable realtime for payments table
ALTER PUBLICATION supabase_realtime ADD TABLE payments;

-- Enable realtime for contracts table
ALTER PUBLICATION supabase_realtime ADD TABLE contracts;

-- Enable realtime for installments table
ALTER PUBLICATION supabase_realtime ADD TABLE installments;

-- Verify tables are in publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### Row Level Security (RLS) Requirements

**Important**: Realtime subscriptions respect RLS policies. Ensure your policies allow users to read the data they're subscribing to:

```sql
-- Example: Payments RLS policy for shop owners
CREATE POLICY "Shop owners can view their payments"
ON payments FOR SELECT
USING (
  shop_id IN (
    SELECT shop_id FROM users WHERE user_id = auth.uid()
  )
);

-- Example: Contracts RLS policy
CREATE POLICY "Users can view their shop's contracts"
ON contracts FOR SELECT
USING (
  shop_id IN (
    SELECT shop_id FROM users WHERE user_id = auth.uid()
  )
);
```

---

## Environment Variables

Add these variables to your `.env.local` file:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Service Role Key (Server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Getting Your Supabase Credentials

1. Go to **Settings** → **API** in Supabase Dashboard
2. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy **service_role key** (if needed) → `SUPABASE_SERVICE_ROLE_KEY`

**⚠️ Security Note**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code. It bypasses RLS.

---

## Client Configuration

The Supabase client is already configured in `src/lib/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  // Realtime is enabled by default
  realtime: {
    params: {
      eventsPerSecond: 10, // Optional: rate limiting
    },
  },
});
```

### Custom Realtime Configuration

For advanced use cases, you can customize the realtime connection:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10, // Max events per second
    },
    // Custom transport (WebSocket by default)
    // transport: 'websocket',
  },
});
```

---

## Using Real-Time Hooks

### Basic Usage

Import and use the real-time hooks in your components:

```typescript
import { useRealtimePayments, useRealtimeContracts, useRealtimeInstallments } from '@/hooks/use-realtime';

function MyComponent() {
  const shopId = 'your-shop-id';

  // Subscribe to payment updates
  useRealtimePayments(shopId, { enabled: true });

  // Subscribe to contract updates
  useRealtimeContracts(shopId, { enabled: true });

  // Subscribe to installment updates
  useRealtimeInstallments(shopId, { enabled: true });

  return <div>Your component</div>;
}
```

### Subscribe to All Tables

Use the convenience hook to subscribe to all tables at once:

```typescript
import { useRealtimeAll } from '@/hooks/use-realtime';

function Dashboard() {
  const shopId = 'your-shop-id';

  // Subscribes to payments, contracts, and installments
  useRealtimeAll(shopId, { enabled: true });

  return <div>Dashboard with live updates</div>;
}
```

### Conditional Subscriptions

Enable/disable subscriptions based on conditions:

```typescript
function ConditionalRealtime() {
  const shopId = 'your-shop-id';
  const isOnline = useNetworkStatus(); // Your custom hook
  const userRole = useUserRole();

  // Only subscribe when online and user is shop owner
  useRealtimeAll(shopId, {
    enabled: isOnline && userRole === 'shop_owner',
  });

  return <div>Conditional real-time updates</div>;
}
```

### Individual Hooks

#### `useRealtimePayments`

Subscribes to payment table changes:

```typescript
useRealtimePayments(shopId, {
  enabled: true, // Enable/disable subscription
});
```

**What it does:**
- Listens for INSERT, UPDATE, DELETE on `payments` table
- Filters by `shop_id`
- Automatically invalidates payment-related queries
- Triggers UI updates via TanStack Query

#### `useRealtimeContracts`

Subscribes to contract table changes:

```typescript
useRealtimeContracts(shopId, {
  enabled: true,
});
```

**What it does:**
- Listens for contract status changes
- Filters by `shop_id`
- Invalidates contract queries
- Updates contract lists in real-time

#### `useRealtimeInstallments`

Subscribes to installment table changes:

```typescript
useRealtimeInstallments(shopId, {
  enabled: true,
});
```

**What it does:**
- Listens for installment payment updates
- Filters by `shop_id`
- Invalidates installment and customer queries
- Updates payment status in real-time

---

## Advanced Configuration

### Custom Channel Names

By default, channels are named `{table}:{shopId}`. You can customize this:

```typescript
const channel = supabase
  .channel('custom-payments-channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'payments',
    filter: `shop_id=eq.${shopId}`,
  }, (payload) => {
    console.log('Custom handler:', payload);
  })
  .subscribe();
```

### Filtering Events

Subscribe to specific events only:

```typescript
// Only listen to INSERT events
const channel = supabase
  .channel('payments-inserts')
  .on('postgres_changes', {
    event: 'INSERT', // Only INSERT
    schema: 'public',
    table: 'payments',
    filter: `shop_id=eq.${shopId}`,
  }, (payload) => {
    console.log('New payment:', payload.new);
  })
  .subscribe();

// Listen to multiple specific events
const channel = supabase
  .channel('payments-updates')
  .on('postgres_changes', {
    event: 'UPDATE', // Only UPDATE
    schema: 'public',
    table: 'payments',
    filter: `shop_id=eq.${shopId}`,
  }, (payload) => {
    console.log('Payment updated:', payload);
  })
  .subscribe();
```

### Advanced Filters

Use PostgreSQL filters for more complex subscriptions:

```typescript
// Only payments above a certain amount
const channel = supabase
  .channel('large-payments')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'payments',
    filter: `shop_id=eq.${shopId} AND amount=gt.10000`,
  }, (payload) => {
    console.log('Large payment:', payload);
  })
  .subscribe();

// Only overdue installments
const channel = supabase
  .channel('overdue-installments')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'installments',
    filter: `shop_id=eq.${shopId} AND payment_status=eq.overdue`,
  }, (payload) => {
    console.log('Overdue installment:', payload);
  })
  .subscribe();
```

### Manual Channel Management

For more control, manage channels manually:

```typescript
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

function CustomRealtimeComponent() {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('custom-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payments',
      }, (payload) => {
        // Custom handling
        console.log('Received:', payload);
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return <div>Custom real-time component</div>;
}
```

### Broadcast Channels (Presence)

For user presence and collaboration:

```typescript
const channel = supabase
  .channel('room:1')
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    console.log('Users in room:', state);
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', newPresences);
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', leftPresences);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        online_at: new Date().toISOString(),
        user: 'user-id',
      });
    }
  });
```

---

## Troubleshooting

### Issue: Real-time updates not working

**Symptoms:**
- No updates received when data changes
- Console shows connection errors

**Solutions:**

1. **Check Realtime is enabled:**
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```

2. **Verify environment variables:**
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

3. **Check browser console for errors:**
   - Open DevTools → Console
   - Look for WebSocket connection errors
   - Check for authentication errors

4. **Verify RLS policies:**
   - Ensure users can SELECT from subscribed tables
   - Test with: `SELECT * FROM payments WHERE shop_id = 'your-shop-id';`

5. **Check Supabase Dashboard:**
   - Settings → API → Realtime enabled
   - Database → Replication → Active slots

### Issue: Too many subscriptions

**Symptoms:**
- Performance degradation
- Connection limits reached

**Solutions:**

1. **Unsubscribe when component unmounts:**
   ```typescript
   useEffect(() => {
     const channel = supabase.channel('...').subscribe();
     return () => {
       supabase.removeChannel(channel);
     };
   }, []);
   ```

2. **Use single subscription hook:**
   ```typescript
   // Instead of multiple hooks, use one
   useRealtimeAll(shopId, { enabled: true });
   ```

3. **Limit subscriptions per page:**
   - Only subscribe on pages that need real-time updates
   - Disable subscriptions when tab is not visible

### Issue: Connection drops frequently

**Symptoms:**
- Intermittent updates
- Reconnection messages in console

**Solutions:**

1. **Check network stability:**
   - Test on different networks
   - Check firewall/proxy settings

2. **Implement reconnection logic:**
   ```typescript
   const channel = supabase
     .channel('payments')
     .on('system', { event: 'disconnect' }, () => {
       console.log('Disconnected, reconnecting...');
       channel.subscribe();
     })
     .subscribe();
   ```

3. **Monitor connection status:**
   ```typescript
   channel.subscribe((status) => {
     if (status === 'SUBSCRIBED') {
       console.log('Connected');
     } else if (status === 'CHANNEL_ERROR') {
       console.error('Connection error');
     }
   });
   ```

### Issue: RLS blocking subscriptions

**Symptoms:**
- Subscriptions connect but no data received
- RLS policy errors in console

**Solutions:**

1. **Verify RLS policies allow SELECT:**
   ```sql
   -- Test policy
   SELECT * FROM payments WHERE shop_id = 'your-shop-id';
   ```

2. **Check user context:**
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Current user:', user);
   ```

3. **Test with service role (development only):**
   ```typescript
   // Only for testing - never in production client code
   const adminClient = createClient(url, serviceRoleKey);
   ```

### Issue: Performance problems

**Symptoms:**
- UI lag when updates arrive
- High CPU usage

**Solutions:**

1. **Debounce updates:**
   ```typescript
   import { debounce } from 'lodash';

   const debouncedInvalidate = debounce(() => {
     queryClient.invalidateQueries({ queryKey: ['payments'] });
   }, 300);
   ```

2. **Limit update frequency:**
   ```typescript
   const channel = supabase
     .channel('payments')
     .on('postgres_changes', {
       event: '*',
       schema: 'public',
       table: 'payments',
     }, (payload) => {
       // Only process important updates
       if (payload.new.status === 'completed') {
         queryClient.invalidateQueries({ queryKey: ['payments'] });
       }
     })
     .subscribe();
   ```

3. **Use selective query invalidation:**
   ```typescript
   // Instead of invalidating all
   queryClient.invalidateQueries({ queryKey: ['payments'] });
   
   // Invalidate specific query
   queryClient.invalidateQueries({ 
     queryKey: ['payments', shopId],
     exact: true 
   });
   ```

---

## Best Practices

### 1. Subscribe Only When Needed

```typescript
// ✅ Good: Conditional subscription
useRealtimePayments(shopId, { 
  enabled: !!shopId && isPageVisible 
});

// ❌ Bad: Always subscribed
useRealtimePayments(shopId); // No conditions
```

### 2. Clean Up Subscriptions

```typescript
// ✅ Good: Proper cleanup
useEffect(() => {
  const channel = supabase.channel('...').subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}, []);

// ❌ Bad: No cleanup
useEffect(() => {
  supabase.channel('...').subscribe();
  // Missing cleanup!
}, []);
```

### 3. Use Specific Filters

```typescript
// ✅ Good: Specific filter
filter: `shop_id=eq.${shopId} AND status=eq.active`

// ❌ Bad: Too broad
filter: `shop_id=eq.${shopId}` // Gets all records
```

### 4. Handle Errors Gracefully

```typescript
const channel = supabase
  .channel('payments')
  .on('postgres_changes', {...}, (payload) => {
    try {
      // Handle update
    } catch (error) {
      console.error('Error processing update:', error);
      // Fallback behavior
    }
  })
  .subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      // Handle error
      console.error('Channel error');
    }
  });
```

### 5. Monitor Subscription Status

```typescript
channel.subscribe((status) => {
  switch (status) {
    case 'SUBSCRIBED':
      console.log('Successfully subscribed');
      break;
    case 'TIMED_OUT':
      console.warn('Subscription timed out');
      break;
    case 'CLOSED':
      console.log('Subscription closed');
      break;
    case 'CHANNEL_ERROR':
      console.error('Channel error');
      break;
  }
});
```

### 6. Use TypeScript Types

```typescript
import { Database } from '@/types/supabase';

type Payment = Database['public']['Tables']['payments']['Row'];

const channel = supabase
  .channel('payments')
  .on<Payment>('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'payments',
  }, (payload) => {
    // payload.new and payload.old are typed
    const payment = payload.new as Payment;
  })
  .subscribe();
```

### 7. Optimize Query Invalidation

```typescript
// ✅ Good: Specific invalidation
queryClient.invalidateQueries({ 
  queryKey: ['payments', shopId],
  exact: true 
});

// ❌ Bad: Invalidates everything
queryClient.invalidateQueries(); // Too broad
```

---

## Security Considerations

### 1. RLS Policies

**Always** use Row Level Security to protect real-time subscriptions:

```sql
-- Example: Shop-scoped policy
CREATE POLICY "Users can only see their shop's payments"
ON payments FOR SELECT
USING (
  shop_id IN (
    SELECT shop_id FROM users WHERE user_id = auth.uid()
  )
);
```

### 2. Filter by Shop ID

Always filter subscriptions by `shop_id` to prevent cross-tenant data leaks:

```typescript
// ✅ Good: Filtered by shop
filter: `shop_id=eq.${shopId}`

// ❌ Bad: No filter (security risk)
filter: undefined // Can see all shops' data
```

### 3. Validate User Permissions

Check user permissions before subscribing:

```typescript
function SecureRealtimeComponent() {
  const { user, profile } = useAuthStore();
  const shopId = profile?.shop_id;

  // Only subscribe if user has access
  useRealtimePayments(shopId, {
    enabled: !!shopId && user?.role === 'shop_owner',
  });

  return <div>Secure component</div>;
}
```

### 4. Never Expose Service Role Key

```typescript
// ❌ NEVER do this in client code
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ✅ Always use anon key in client
const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

### 5. Monitor Subscription Activity

Log subscription activity for security auditing:

```typescript
const channel = supabase
  .channel('payments')
  .on('postgres_changes', {...}, (payload) => {
    // Log for audit
    console.log('Realtime update:', {
      table: 'payments',
      event: payload.eventType,
      user: auth.uid(),
      timestamp: new Date().toISOString(),
    });
  })
  .subscribe();
```

### 6. Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// In Supabase Dashboard → Settings → API
// Configure rate limits for realtime connections
```

---

## Testing Real-Time Features

### Manual Testing

1. **Open two browser windows:**
   - Window 1: Dashboard with real-time subscriptions
   - Window 2: Admin panel to make changes

2. **Make a change in Window 2:**
   - Create a payment
   - Update a contract
   - Change installment status

3. **Verify Window 1 updates automatically:**
   - No page refresh needed
   - Data appears immediately

### Automated Testing

```typescript
// Example: Test real-time subscription
import { renderHook, waitFor } from '@testing-library/react';
import { useRealtimePayments } from '@/hooks/use-realtime';

test('subscribes to payment updates', async () => {
  const { result } = renderHook(() => 
    useRealtimePayments('shop-id', { enabled: true })
  );

  // Simulate payment update
  await supabase
    .from('payments')
    .insert({ amount: 1000, shop_id: 'shop-id' });

  // Wait for subscription to trigger
  await waitFor(() => {
    expect(queryClient.getQueryState(['payments'])).toBeDefined();
  });
});
```

---

## Additional Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Logical Replication](https://www.postgresql.org/docs/current/logical-replication.html)
- [WebSocket API Reference](https://supabase.com/docs/reference/javascript/realtime-api)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Supabase Dashboard → Logs
3. Check browser console for errors
4. Verify environment variables
5. Contact support: support@maliktech.com

---

**Last Updated**: 2024-11-22  
**Version**: 1.0.0

