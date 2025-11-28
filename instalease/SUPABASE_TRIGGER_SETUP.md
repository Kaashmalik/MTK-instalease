# Supabase Trigger Setup - Step by Step

**Error You're Seeing**: `ERROR: 42501: must be owner of relation users`

**Why**: The GRANT statements need superuser permissions. In Supabase SQL Editor, you already have the right permissions, so we don't need GRANT statements.

---

## ✅ Solution: Run This SQL

### Copy and paste this into Supabase SQL Editor:

```sql
-- Step 1: Drop existing trigger and function (if any)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Create the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert new user profile
  INSERT INTO public.users (
    user_id,
    email,
    phone,
    username,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(
      NEW.raw_user_meta_data->>'username', 
      split_part(COALESCE(NEW.email, ''), '@', 1), 
      'user_' || substring(NEW.id::text, 1, 8)
    ),
    'customer',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Verify it worked
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

---

## 📋 Step-by-Step Instructions

### 1. Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**

### 2. Paste the SQL

Copy the SQL code above and paste it into the editor

### 3. Run the Query

Click **Run** (or press Ctrl+Enter)

### 4. Verify Success

You should see:

```
Success. No rows returned
```

And in the verification query results:

```
trigger_name: on_auth_user_created
event_manipulation: INSERT
event_object_table: users
```

---

## 🧪 Test the Trigger

### Option 1: Create a Test User in Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. Click **Create user**
5. Go to **Table Editor** → **users**
6. You should see the new user profile automatically created!

### Option 2: Test via Your App

```bash
# 1. Start your app
npm run dev

# 2. Go to signup
http://localhost:3000/auth/signup

# 3. Create a new account
Username: testuser123
Email: test123@example.com
Password: password123

# 4. Check Supabase
# Authentication → Users (should see new user)
# Table Editor → users (should see profile)
```

---

## 🔍 Troubleshooting

### Error: "relation users does not exist"

**Solution**: Create the users table first

```sql
CREATE TABLE IF NOT EXISTS public.users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  shop_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = user_id);
```

### Error: "trigger already exists"

**Solution**: The DROP TRIGGER statement should handle this, but if not:

```sql
DROP TRIGGER on_auth_user_created ON auth.users CASCADE;
```

### Error: "function already exists"

**Solution**: Use `CREATE OR REPLACE FUNCTION` (already in the script)

---

## ✅ Verification Checklist

After running the SQL:

- [ ] No errors in SQL Editor
- [ ] Trigger shows in verification query
- [ ] Test user creation works
- [ ] Profile appears in users table
- [ ] No errors in console

---

## 🎯 What This Does

### When a User Signs Up:

```
1. User submits signup form
   ↓
2. Supabase Auth creates user in auth.users
   ↓
3. Trigger fires automatically
   ↓
4. handle_new_user() function runs
   ↓
5. Profile inserted into public.users
   ↓
6. User can now login and use the app
```

### Data Mapping:

| Auth Field | Users Table Field | Notes |
|------------|-------------------|-------|
| `id` | `user_id` | Primary key |
| `email` | `email` | From signup form |
| `phone` | `phone` | From signup form |
| `raw_user_meta_data->>'username'` | `username` | From signup form |
| (none) | `role` | Default: 'customer' |
| (none) | `created_at` | Auto: NOW() |
| (none) | `updated_at` | Auto: NOW() |

---

## 🚀 Alternative: Manual Profile Creation

If you prefer to create profiles manually (not recommended):

```typescript
// In Signup.tsx, after auth.signUp:
if (authResponse.data.user) {
  // Create profile manually
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      user_id: authResponse.data.user.id,
      email: authResponse.data.user.email,
      phone: authResponse.data.user.phone,
      username: username,
      role: 'customer',
    });
  
  if (profileError) {
    console.error('Profile creation failed:', profileError);
  }
}
```

**Why Trigger is Better**:
- ✅ Automatic (no code needed)
- ✅ Works for all signup methods
- ✅ Can't be bypassed
- ✅ Consistent
- ✅ Less code to maintain

---

## 📊 Current Status

Based on your screenshot:

- ✅ Supabase SQL Editor open
- ✅ Migration file visible
- ❌ GRANT statements causing error
- ✅ Solution: Use simplified SQL above

---

## 🎉 Summary

**Problem**: GRANT statements need owner permissions  
**Solution**: Remove GRANT statements (not needed in Supabase SQL Editor)  
**Action**: Copy the SQL from this guide and run it  
**Result**: Automatic profile creation on signup

**Ready to run!** Just copy-paste the SQL above into your Supabase SQL Editor.

---

**File**: `SUPABASE_TRIGGER_SETUP.md`  
**Status**: ✅ Ready to use  
**Time**: 2 minutes to setup
