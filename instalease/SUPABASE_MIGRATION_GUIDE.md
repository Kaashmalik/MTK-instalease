# Supabase Migration Guide

This guide provides the exact sequence to run SQL migration files in your Supabase project.

## 📋 Migration Files Sequence

Run these files **in order** in your Supabase SQL Editor:

### Step 1: Initial Schema (REQUIRED - Run First)
**File:** `supabase/migrations/001_initial_schema.sql`

**What it creates:**
- ✅ All database tables (shops, users, customers, guarantors, contracts, installments, payments, etc.)
- ✅ Row Level Security (RLS) policies for multi-tenancy
- ✅ Indexes for performance
- ✅ Foreign key constraints
- ✅ Triggers for data integrity
- ✅ Functions for business logic

**Status:** ⚠️ **MUST RUN FIRST** - This is the foundation

---

### Step 2: Audit Logs (OPTIONAL - Run After Step 1)
**File:** `supabase/migrations/002_audit_logs.sql`

**What it creates:**
- ✅ Audit logs table for compliance tracking
- ✅ Audit trigger functions
- ✅ Triggers on existing tables to log changes
- ✅ Indexes for audit log queries

**Status:** ⚠️ **REQUIRES Step 1** - Depends on tables created in Step 1

---

## 🚀 How to Run Migrations

### Method 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run Step 1: Initial Schema**
   - Open file: `instalease/supabase/migrations/001_initial_schema.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run** (or press `Ctrl+Enter`)
   - Wait for "Success. No rows returned" message
   - ✅ Verify: Check that tables are created in **Table Editor**

4. **Run Step 2: Audit Logs** (Optional)
   - Open file: `instalease/supabase/migrations/002_audit_logs.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run** (or press `Ctrl+Enter`)
   - Wait for "Success. No rows returned" message
   - ✅ Verify: Check that `audit_logs` table exists

### Method 2: Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Initialize Supabase (if not done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

---

## ✅ Verification Checklist

After running migrations, verify:

### Step 1 Verification:
- [ ] **Tables created:**
  - [ ] `shops`
  - [ ] `users`
  - [ ] `customers`
  - [ ] `guarantors`
  - [ ] `contracts`
  - [ ] `installments`
  - [ ] `payments`
  - [ ] `reminders_log`
  - [ ] `late_fees`

- [ ] **RLS enabled:**
  - Go to **Authentication** → **Policies**
  - Verify policies exist for each table

- [ ] **Extensions enabled:**
  - `uuid-ossp` extension should be enabled

### Step 2 Verification (if run):
- [ ] `audit_logs` table exists
- [ ] Audit triggers are active on tables

---

## 🔍 How to Check if Migrations Ran Successfully

### Check Tables:
1. Go to **Table Editor** in Supabase Dashboard
2. You should see all tables listed
3. Click on a table to verify columns

### Check RLS Policies:
1. Go to **Authentication** → **Policies**
2. Select a table (e.g., `customers`)
3. You should see RLS policies listed

### Check Functions:
1. Go to **Database** → **Functions**
2. You should see functions like:
   - `check_guarantor_limit()`
   - `update_updated_at_column()`
   - `audit_trigger_function()` (if Step 2 was run)

---

## ⚠️ Important Notes

### 1. Run in Order
- **Always run `001_initial_schema.sql` FIRST**
- `002_audit_logs.sql` depends on tables created in Step 1
- Running out of order will cause errors

### 2. Don't Run Twice
- If you've already run a migration, don't run it again
- The `IF NOT EXISTS` clauses prevent errors, but it's best to check first

### 3. Backup First (Production)
- Before running migrations on production, create a backup
- Go to **Settings** → **Database** → **Backups**

### 4. Check for Errors
- If you see any errors, read them carefully
- Common issues:
  - Missing extensions (should auto-create)
  - Permission errors (check your role)
  - Syntax errors (verify SQL file)

---

## 🐛 Troubleshooting

### Error: "relation already exists"
- **Cause:** Migration was already run
- **Solution:** Skip that table or drop it first (if safe)

### Error: "permission denied"
- **Cause:** Insufficient permissions
- **Solution:** Ensure you're using the correct database role

### Error: "extension does not exist"
- **Cause:** Extension not enabled
- **Solution:** Run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` first

### Error: "foreign key constraint"
- **Cause:** Tables created out of order
- **Solution:** Run migrations in the correct sequence

---

## 📝 Quick Reference

| Step | File | Status | Dependencies |
|------|------|--------|--------------|
| 1 | `001_initial_schema.sql` | ✅ Required | None |
| 2 | `002_audit_logs.sql` | ⚠️ Optional | Step 1 |

---

## 🎯 Next Steps After Migrations

1. ✅ **Verify Tables:** Check all tables exist
2. ✅ **Test RLS:** Try creating a record to verify RLS works
3. ✅ **Create First Shop:** Create a test shop in the `shops` table
4. ✅ **Test Authentication:** Sign up a user and verify profile creation
5. ✅ **Enable Realtime:** Follow `REALTIME_SETUP.md` to enable real-time features

---

## 📚 Related Documentation

- [SETUP.md](./SETUP.md) - Complete setup guide
- [REALTIME_SETUP.md](./REALTIME_SETUP.md) - Real-time configuration
- [ENV_SETUP.md](./ENV_SETUP.md) - Environment variables guide

---

**Need Help?** Contact support@maliktech.com

