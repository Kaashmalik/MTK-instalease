# Post-Migration Verification Checklist

## ✅ Migrations Completed Successfully!

Both migration files have been run. Now let's verify everything is set up correctly.

---

## 🔍 Verification Steps

### 1. Verify Tables Created

Go to **Supabase Dashboard → Table Editor** and verify these tables exist:

- [ ] `shops`
- [ ] `users`
- [ ] `customers`
- [ ] `guarantors`
- [ ] `contracts`
- [ ] `installments`
- [ ] `payments`
- [ ] `reminders_log`
- [ ] `late_fees`
- [ ] `audit_logs` (from migration 2)

**Total: 10 tables**

---

### 2. Verify Row Level Security (RLS)

Go to **Authentication → Policies** and check:

- [ ] RLS is enabled on all tables
- [ ] Policies exist for each table
- [ ] Shop isolation policies are in place

**Quick Test:**
- Click on `customers` table → Policies tab
- You should see "Shop isolation for customers" policy

---

### 3. Verify Functions Created

Go to **Database → Functions** and verify:

- [ ] `check_guarantor_limit()` - Enforces max 3 guarantees
- [ ] `update_updated_at_column()` - Auto-updates timestamps
- [ ] `audit_shops_trigger()` - Audit logging for shops
- [ ] `audit_users_trigger()` - Audit logging for users
- [ ] `audit_customers_trigger()` - Audit logging for customers
- [ ] `audit_contracts_trigger()` - Audit logging for contracts
- [ ] `audit_payments_trigger()` - Audit logging for payments

**Total: 7 functions**

---

### 4. Verify Triggers Created

Go to **Database → Triggers** and verify:

**From Migration 1:**
- [ ] `trigger_check_guarantor_limit` (on contracts)
- [ ] `update_shops_updated_at` (on shops)
- [ ] `update_users_updated_at` (on users)
- [ ] `update_customers_updated_at` (on customers)
- [ ] `update_guarantors_updated_at` (on guarantors)
- [ ] `update_contracts_updated_at` (on contracts)
- [ ] `update_installments_updated_at` (on installments)
- [ ] `update_payments_updated_at` (on payments)

**From Migration 2:**
- [ ] `audit_shops_trigger` (on shops)
- [ ] `audit_users_trigger` (on users)
- [ ] `audit_customers_trigger` (on customers)
- [ ] `audit_contracts_trigger` (on contracts)
- [ ] `audit_payments_trigger` (on payments)

**Total: 13 triggers**

---

### 5. Verify Indexes Created

Go to **Database → Indexes** and verify key indexes exist:

- [ ] `idx_users_shop_id`
- [ ] `idx_customers_shop_id`
- [ ] `idx_customers_cnic`
- [ ] `idx_contracts_shop_id`
- [ ] `idx_installments_due_date`
- [ ] `idx_payments_shop_id`
- [ ] `idx_audit_logs_table_record`
- [ ] `idx_audit_logs_shop_id`

---

## 🧪 Test the Setup

### Test 1: Create a Test Shop

1. Go to **Table Editor → shops**
2. Click **Insert → Insert row**
3. Add:
   - `shop_name`: "Test Shop"
   - `subscription_status`: "trial"
4. Click **Save**
5. ✅ Verify: Shop created successfully
6. ✅ Verify: Check `audit_logs` table - should have an INSERT record

### Test 2: Verify RLS is Working

1. Try to query from SQL Editor:
   ```sql
   SELECT * FROM customers;
   ```
2. ✅ Should return empty (or only your shop's data if you have any)
3. This confirms RLS is active

### Test 3: Verify Triggers Work

1. Create a test customer:
   ```sql
   INSERT INTO customers (shop_id, full_name, cnic_number, phone)
   VALUES (
     'your-shop-id-here',
     'Test Customer',
     '1234567890123',
     '+923001234567'
   );
   ```
2. ✅ Check `updated_at` is set automatically
3. ✅ Check `audit_logs` has a record

---

## 🚀 Next Steps

### 1. Enable Realtime (Optional but Recommended)

Follow the guide in `REALTIME_SETUP.md`:

1. Go to **Settings → API**
2. Enable **Realtime**
3. Go to **Database → Tables**
4. Enable Realtime for:
   - `payments`
   - `contracts`
   - `installments`

### 2. Create Your First Admin User

You'll need to create a user through the application signup, but first create a shop:

**Option A: Via SQL (Quick Test)**
```sql
-- Create a test shop
INSERT INTO shops (shop_name, subscription_status)
VALUES ('My Shop', 'active')
RETURNING shop_id;

-- Note the shop_id, you'll need it when signing up
```

**Option B: Via Application**
1. Start your app: `npm run dev`
2. Go to signup page
3. Create an account
4. The app should create the user profile automatically

### 3. Test Authentication

1. Go to `http://localhost:3000/auth/signup`
2. Create an account
3. ✅ Verify: User profile created in `users` table
4. ✅ Verify: Can log in successfully

### 4. Test Multi-Tenancy

1. Create two shops (via SQL or app)
2. Create users for each shop
3. ✅ Verify: Users can only see their shop's data

---

## 📋 Quick SQL Queries for Verification

### Count All Tables
```sql
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Check RLS Status
```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Count Functions
```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

### Count Triggers
```sql
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

---

## ✅ Success Criteria

Your database is fully set up when:

- [x] ✅ Both migrations ran successfully
- [ ] ✅ All 10 tables exist
- [ ] ✅ RLS is enabled on all tables
- [ ] ✅ All functions are created
- [ ] ✅ All triggers are active
- [ ] ✅ Can create a shop
- [ ] ✅ Can create a user
- [ ] ✅ RLS prevents cross-shop data access
- [ ] ✅ Audit logs are working

---

## 🎉 Congratulations!

Your InstalEase database is now fully configured with:
- ✅ Multi-tenant architecture
- ✅ Row Level Security
- ✅ Audit logging
- ✅ Data integrity constraints
- ✅ Performance indexes
- ✅ Automated triggers

**You're ready to start using the application!**

---

## 📚 Related Documentation

- [SETUP.md](./SETUP.md) - Complete setup guide
- [REALTIME_SETUP.md](./REALTIME_SETUP.md) - Enable real-time features
- [ENV_SETUP.md](./ENV_SETUP.md) - Environment variables
- [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md) - Migration reference

---

**Need Help?** Contact support@maliktech.com

