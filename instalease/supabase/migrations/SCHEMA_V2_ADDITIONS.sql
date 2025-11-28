-- ============================================================================
-- INSTALEASE SCHEMA V2 ADDITIONS
-- Payment Slips, Theme Settings, Profile Updates
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PAYMENT SLIPS TABLE (for shop application payments)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_slips (
  slip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES shop_applications(application_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
  bank_name VARCHAR(100),
  transaction_id VARCHAR(100),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  slip_image_url TEXT NOT NULL,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for payment slips
CREATE INDEX IF NOT EXISTS idx_payment_slips_application ON payment_slips(application_id);
CREATE INDEX IF NOT EXISTS idx_payment_slips_user ON payment_slips(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_slips_status ON payment_slips(status);

-- ----------------------------------------------------------------------------
-- SUBSCRIPTION PLANS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
  plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2),
  max_users INTEGER NOT NULL DEFAULT 5,
  max_customers INTEGER NOT NULL DEFAULT 100,
  max_contracts INTEGER DEFAULT NULL, -- NULL = unlimited
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (plan_name, display_name, description, price_monthly, price_yearly, max_users, max_customers, features) VALUES
('basic', 'Basic', 'Perfect for small shops', 2999, 29990, 3, 50, '["Basic Reports", "Email Support", "1 Admin User"]'),
('professional', 'Professional', 'For growing businesses', 5999, 59990, 10, 200, '["Advanced Reports", "WhatsApp Notifications", "Priority Support", "5 Admin Users"]'),
('enterprise', 'Enterprise', 'For large operations', 9999, 99990, 50, 1000, '["Custom Reports", "API Access", "Dedicated Support", "Unlimited Admins", "White Label"]')
ON CONFLICT (plan_name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- USER SETTINGS TABLE (Theme, Preferences)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
  setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Theme Settings
  theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  primary_color VARCHAR(20) DEFAULT 'blue',
  sidebar_collapsed BOOLEAN DEFAULT false,
  -- Notification Preferences
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  -- Display Preferences
  language VARCHAR(10) DEFAULT 'en',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  currency_format VARCHAR(10) DEFAULT 'PKR',
  timezone VARCHAR(50) DEFAULT 'Asia/Karachi',
  -- Dashboard Preferences
  dashboard_layout JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- UPDATE SHOP APPLICATIONS TABLE (Add payment fields)
-- ----------------------------------------------------------------------------
ALTER TABLE shop_applications 
  ADD COLUMN IF NOT EXISTS selected_plan VARCHAR(50) DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid' 
    CHECK (payment_status IN ('unpaid', 'pending', 'verified', 'failed')),
  ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_verified_by UUID REFERENCES auth.users(id);

-- ----------------------------------------------------------------------------
-- RLS POLICIES FOR NEW TABLES
-- ----------------------------------------------------------------------------

-- Payment Slips RLS
ALTER TABLE payment_slips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment slips" ON payment_slips
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payment slips" ON payment_slips
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admin can view all payment slips" ON payment_slips
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Super admin can update payment slips" ON payment_slips
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- User Settings RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (user_id = auth.uid());

-- Subscription Plans RLS (public read)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admin can manage plans" ON subscription_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- ----------------------------------------------------------------------------
-- FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to verify payment slip
CREATE OR REPLACE FUNCTION verify_payment_slip(
  p_slip_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_application_id UUID;
  v_amount DECIMAL;
BEGIN
  -- Check if caller is super_admin
  IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Only super admin can verify payment slips';
  END IF;

  -- Get application info
  SELECT application_id, amount INTO v_application_id, v_amount
  FROM payment_slips WHERE slip_id = p_slip_id;

  IF v_application_id IS NULL THEN
    RAISE EXCEPTION 'Payment slip not found';
  END IF;

  -- Update payment slip
  UPDATE payment_slips SET
    status = 'verified',
    verified_by = auth.uid(),
    verified_at = NOW(),
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE slip_id = p_slip_id;

  -- Update application payment status
  UPDATE shop_applications SET
    payment_status = 'verified',
    payment_amount = v_amount,
    payment_verified_at = NOW(),
    payment_verified_by = auth.uid(),
    status = CASE WHEN status = 'pending' THEN 'under_review' ELSE status END,
    updated_at = NOW()
  WHERE application_id = v_application_id;

  RETURN TRUE;
END;
$$;

-- Function to reject payment slip
CREATE OR REPLACE FUNCTION reject_payment_slip(
  p_slip_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_application_id UUID;
BEGIN
  -- Check if caller is super_admin
  IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Only super admin can reject payment slips';
  END IF;

  -- Get application info
  SELECT application_id INTO v_application_id
  FROM payment_slips WHERE slip_id = p_slip_id;

  IF v_application_id IS NULL THEN
    RAISE EXCEPTION 'Payment slip not found';
  END IF;

  -- Update payment slip
  UPDATE payment_slips SET
    status = 'rejected',
    verified_by = auth.uid(),
    verified_at = NOW(),
    rejection_reason = p_reason,
    updated_at = NOW()
  WHERE slip_id = p_slip_id;

  -- Update application payment status
  UPDATE shop_applications SET
    payment_status = 'failed',
    updated_at = NOW()
  WHERE application_id = v_application_id;

  RETURN TRUE;
END;
$$;

-- Function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users SET
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    updated_at = NOW()
  WHERE user_id = auth.uid();

  RETURN TRUE;
END;
$$;

-- Function to get or create user settings
CREATE OR REPLACE FUNCTION get_or_create_user_settings()
RETURNS user_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings user_settings;
BEGIN
  -- Try to get existing settings
  SELECT * INTO v_settings FROM user_settings WHERE user_id = auth.uid();
  
  -- If not exists, create default settings
  IF v_settings IS NULL THEN
    INSERT INTO user_settings (user_id)
    VALUES (auth.uid())
    RETURNING * INTO v_settings;
  END IF;

  RETURN v_settings;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_payment_slip TO authenticated;
GRANT EXECUTE ON FUNCTION reject_payment_slip TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_user_settings TO authenticated;

-- ----------------------------------------------------------------------------
-- STORAGE BUCKETS SETUP
-- ----------------------------------------------------------------------------
-- Note: Storage buckets need to be created via Supabase Dashboard or API
-- These policies assume the buckets already exist

-- Payment Slips Bucket Policies
-- Bucket name: payment-slips
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-slips', 'payment-slips', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Avatars Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for payment-slips bucket
CREATE POLICY "Users can upload payment slips" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-slips' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own payment slips" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'payment-slips' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Super admin can view all payment slips" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-slips' AND
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- Storage Policies for avatars bucket
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- ----------------------------------------------------------------------------
-- TRIGGER FOR UPDATED_AT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to new tables
DROP TRIGGER IF EXISTS update_payment_slips_updated_at ON payment_slips;
CREATE TRIGGER update_payment_slips_updated_at
  BEFORE UPDATE ON payment_slips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
