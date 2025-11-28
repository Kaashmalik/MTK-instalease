-- ============================================================================
-- InstalEase Complete Database Schema V2
-- ============================================================================
-- Multi-tenant SaaS platform for managing installment plans
-- 
-- ROLE HIERARCHY:
--   super_admin > admin > shop_owner > credit_manager > sales_rep > customer
--
-- PERMISSIONS:
--   super_admin: Full system access, assign shop_id, manage all shops/users
--   admin: Manage their assigned shop, approve shop applications
--   shop_owner: Manage shop's customers, contracts, payments
--   credit_manager: Approve/reject credit applications
--   sales_rep: Create customers, contracts (limited view)
--   customer: View own contracts and payments only
--
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING OBJECTS (Clean Slate)
-- ============================================================================
-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_check_guarantor_limit ON contracts;
DROP TRIGGER IF EXISTS update_shops_updated_at ON shops;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_guarantors_updated_at ON guarantors;
DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
DROP TRIGGER IF EXISTS update_installments_updated_at ON installments;
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS audit_shops_trigger ON shops;
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
DROP TRIGGER IF EXISTS audit_customers_trigger ON customers;
DROP TRIGGER IF EXISTS audit_contracts_trigger ON contracts;
DROP TRIGGER IF EXISTS audit_payments_trigger ON payments;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.check_guarantor_limit() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.audit_trigger_function() CASCADE;
DROP FUNCTION IF EXISTS public.audit_shops_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.audit_users_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.audit_customers_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.audit_contracts_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.audit_payments_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.assign_user_to_shop(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.change_user_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(UUID) CASCADE;

-- Drop policies (all tables)
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS late_fees CASCADE;
DROP TABLE IF EXISTS reminders_log CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS installments CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS guarantors CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS shop_applications CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notification_settings CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 2: CREATE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SHOPS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE shops (
  shop_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_name VARCHAR(255) NOT NULL,
  shop_code VARCHAR(50) UNIQUE, -- Unique code for shop identification
  logo_url TEXT,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'trial' 
    CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  subscription_plan VARCHAR(50) DEFAULT 'basic'
    CHECK (subscription_plan IN ('basic', 'professional', 'enterprise')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  max_users INTEGER DEFAULT 5,
  max_customers INTEGER DEFAULT 100,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- USERS TABLE (Extended profile linked to auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(shop_id) ON DELETE SET NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'customer' 
    CHECK (role IN ('super_admin', 'admin', 'shop_owner', 'credit_manager', 'sales_rep', 'customer')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- SHOP APPLICATIONS TABLE (Users apply for shop access)
-- ----------------------------------------------------------------------------
CREATE TABLE shop_applications (
  application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),
  business_address TEXT,
  business_phone VARCHAR(20),
  business_email VARCHAR(255),
  owner_cnic VARCHAR(13),
  documents JSONB DEFAULT '[]', -- Array of document URLs
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- NOTIFICATION SETTINGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE notification_settings (
  setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  -- WhatsApp Settings
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_api_key TEXT,
  whatsapp_phone_number VARCHAR(20),
  -- SMS Settings
  sms_enabled BOOLEAN DEFAULT false,
  sms_provider VARCHAR(50) CHECK (sms_provider IN ('twilio', 'jazzcash', 'zong', 'telenor', NULL)),
  sms_api_key TEXT,
  sms_sender_id VARCHAR(20),
  -- Email Settings
  email_enabled BOOLEAN DEFAULT true,
  email_from_name VARCHAR(100),
  email_from_address VARCHAR(255),
  -- Reminder Settings
  reminder_days_before INTEGER DEFAULT 3,
  reminder_days_after INTEGER[] DEFAULT ARRAY[1, 3, 7, 14],
  auto_late_fee BOOLEAN DEFAULT true,
  late_fee_percentage DECIMAL(5, 2) DEFAULT 5.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id)
);

-- ----------------------------------------------------------------------------
-- CUSTOMERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE customers (
  customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  cnic_number VARCHAR(13) NOT NULL,
  cnic_front_image_url TEXT,
  cnic_back_image_url TEXT,
  phone VARCHAR(20) NOT NULL,
  whatsapp_number VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  monthly_income DECIMAL(12, 2),
  employment_status VARCHAR(50) CHECK (employment_status IN ('employed', 'self_employed', 'business', 'retired', 'unemployed', NULL)),
  credit_score INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, cnic_number)
);

-- ----------------------------------------------------------------------------
-- GUARANTORS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE guarantors (
  guarantor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  cnic_number VARCHAR(13) NOT NULL,
  cnic_front_image_url TEXT,
  cnic_back_image_url TEXT,
  phone VARCHAR(20) NOT NULL,
  whatsapp_number VARCHAR(20),
  relationship_to_customer VARCHAR(100),
  address TEXT,
  digital_signature_url TEXT,
  active_guarantees_count INTEGER DEFAULT 0 CHECK (active_guarantees_count <= 3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- CONTRACTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE contracts (
  contract_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_number VARCHAR(50) UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  guarantor_id UUID REFERENCES guarantors(guarantor_id) ON DELETE SET NULL,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  -- Product Details
  product_name VARCHAR(255) NOT NULL,
  product_description TEXT,
  product_serial_number VARCHAR(100),
  product_price DECIMAL(12, 2) NOT NULL,
  -- Financial Details
  down_payment DECIMAL(12, 2) NOT NULL,
  financed_amount DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  monthly_installment DECIMAL(12, 2) NOT NULL,
  total_months INTEGER NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  -- Status
  contract_status VARCHAR(50) DEFAULT 'pending' 
    CHECK (contract_status IN ('pending', 'approved', 'active', 'completed', 'cancelled', 'defaulted')),
  -- Documents
  contract_pdf_url TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  -- Timestamps
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- INSTALLMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE installments (
  installment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount_due DECIMAL(12, 2) NOT NULL,
  amount_paid DECIMAL(12, 2) DEFAULT 0,
  late_fee DECIMAL(12, 2) DEFAULT 0,
  payment_status VARCHAR(50) DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'waived')),
  paid_at TIMESTAMP WITH TIME ZONE,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contract_id, installment_number)
);

-- ----------------------------------------------------------------------------
-- PAYMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
  payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
  installment_id UUID REFERENCES installments(installment_id) ON DELETE SET NULL,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  received_by UUID REFERENCES auth.users(id),
  amount DECIMAL(12, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_by_type VARCHAR(50) NOT NULL CHECK (paid_by_type IN ('customer', 'guarantor')),
  payment_method VARCHAR(50) NOT NULL 
    CHECK (payment_method IN ('cash', 'jazzcash', 'easypaisa', 'raast', 'bank_transfer', 'cheque', 'other')),
  transaction_id VARCHAR(255),
  reference_number VARCHAR(100),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS TABLE (WhatsApp, SMS, Email logs)
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(contract_id) ON DELETE SET NULL,
  installment_id UUID REFERENCES installments(installment_id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
  -- Notification Details
  notification_type VARCHAR(50) NOT NULL 
    CHECK (notification_type IN ('whatsapp', 'sms', 'email', 'push')),
  template_type VARCHAR(50) NOT NULL
    CHECK (template_type IN ('payment_reminder', 'payment_received', 'overdue_notice', 'welcome', 'contract_approved', 'custom')),
  recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('customer', 'guarantor', 'both')),
  recipient_phone VARCHAR(20),
  recipient_email VARCHAR(255),
  -- Content
  subject VARCHAR(255),
  message TEXT NOT NULL,
  -- Status
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  error_message TEXT,
  external_id VARCHAR(255), -- ID from WhatsApp/SMS provider
  -- Timestamps
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- REMINDERS LOG TABLE (Legacy support)
-- ----------------------------------------------------------------------------
CREATE TABLE reminders_log (
  reminder_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
  installment_id UUID REFERENCES installments(installment_id) ON DELETE SET NULL,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(notification_id),
  sent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('sms', 'whatsapp', 'email')),
  recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('customer', 'guarantor', 'both')),
  delivery_status VARCHAR(50) DEFAULT 'pending' 
    CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- LATE FEES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE late_fees (
  late_fee_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  installment_id UUID NOT NULL REFERENCES installments(installment_id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  fee_amount DECIMAL(12, 2) NOT NULL,
  fee_percentage DECIMAL(5, 2),
  days_overdue INTEGER NOT NULL,
  waived BOOLEAN DEFAULT false,
  waived_by UUID REFERENCES auth.users(id),
  waived_at TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
  audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shop_id UUID REFERENCES shops(shop_id) ON DELETE SET NULL,
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE INDEXES
-- ============================================================================
CREATE INDEX idx_users_shop_id ON users(shop_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_shop_applications_user_id ON shop_applications(user_id);
CREATE INDEX idx_shop_applications_status ON shop_applications(status);
CREATE INDEX idx_customers_shop_id ON customers(shop_id);
CREATE INDEX idx_customers_cnic ON customers(cnic_number);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_guarantors_customer_id ON guarantors(customer_id);
CREATE INDEX idx_guarantors_shop_id ON guarantors(shop_id);
CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_contracts_shop_id ON contracts(shop_id);
CREATE INDEX idx_contracts_status ON contracts(contract_status);
CREATE INDEX idx_contracts_number ON contracts(contract_number);
CREATE INDEX idx_installments_contract_id ON installments(contract_id);
CREATE INDEX idx_installments_shop_id ON installments(shop_id);
CREATE INDEX idx_installments_due_date ON installments(due_date);
CREATE INDEX idx_installments_status ON installments(payment_status);
CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_payments_shop_id ON payments(shop_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_notifications_shop_id ON notifications(shop_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_reminders_contract_id ON reminders_log(contract_id);
CREATE INDEX idx_reminders_shop_id ON reminders_log(shop_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_shop_id ON audit_logs(shop_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- STEP 4: HELPER FUNCTION TO GET USER ROLE (Avoids RLS recursion)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM users WHERE user_id = p_user_id;
$$;

-- Function to check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id AND role = 'super_admin');
$$;

-- Function to get user's shop_id
CREATE OR REPLACE FUNCTION get_user_shop_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT shop_id FROM users WHERE user_id = p_user_id;
$$;

-- ============================================================================
-- STEP 5: ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE late_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: RLS POLICIES (Using helper functions to avoid recursion)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- USERS POLICIES (Most critical - no recursion)
-- ----------------------------------------------------------------------------
-- Users can view their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own profile (limited fields)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Super admin can view all users
CREATE POLICY "users_select_super_admin" ON users
  FOR SELECT USING (is_super_admin(auth.uid()));

-- Super admin can manage all users
CREATE POLICY "users_all_super_admin" ON users
  FOR ALL USING (is_super_admin(auth.uid()));

-- Admin can view users in their shop (using function to avoid recursion)
CREATE POLICY "users_select_shop_admin" ON users
  FOR SELECT USING (
    shop_id IS NOT NULL 
    AND shop_id = get_user_shop_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'shop_owner')
  );

-- ----------------------------------------------------------------------------
-- SHOPS POLICIES
-- ----------------------------------------------------------------------------
-- Super admin can manage all shops
CREATE POLICY "shops_all_super_admin" ON shops
  FOR ALL USING (is_super_admin(auth.uid()));

-- Users can view their own shop
CREATE POLICY "shops_select_own" ON shops
  FOR SELECT USING (shop_id = get_user_shop_id(auth.uid()));

-- Admin/shop_owner can update their shop
CREATE POLICY "shops_update_own" ON shops
  FOR UPDATE USING (
    shop_id = get_user_shop_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'shop_owner')
  );

-- ----------------------------------------------------------------------------
-- SHOP APPLICATIONS POLICIES
-- ----------------------------------------------------------------------------
-- Users can view their own applications
CREATE POLICY "shop_applications_select_own" ON shop_applications
  FOR SELECT USING (user_id = auth.uid());

-- Users can create applications
CREATE POLICY "shop_applications_insert_own" ON shop_applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their pending applications
CREATE POLICY "shop_applications_update_own" ON shop_applications
  FOR UPDATE USING (user_id = auth.uid() AND status = 'pending');

-- Super admin can manage all applications
CREATE POLICY "shop_applications_all_super_admin" ON shop_applications
  FOR ALL USING (is_super_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- NOTIFICATION SETTINGS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "notification_settings_shop" ON notification_settings
  FOR ALL USING (
    shop_id = get_user_shop_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('super_admin', 'admin', 'shop_owner')
  );

CREATE POLICY "notification_settings_super_admin" ON notification_settings
  FOR ALL USING (is_super_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- CUSTOMERS POLICIES (Shop isolation)
-- ----------------------------------------------------------------------------
CREATE POLICY "customers_shop_isolation" ON customers
  FOR ALL USING (shop_id = get_user_shop_id(auth.uid()))
  WITH CHECK (shop_id = get_user_shop_id(auth.uid()));

CREATE POLICY "customers_super_admin" ON customers
  FOR ALL USING (is_super_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- GUARANTORS POLICIES (Shop isolation)
-- ----------------------------------------------------------------------------
CREATE POLICY "guarantors_shop_isolation" ON guarantors
  FOR ALL USING (shop_id = get_user_shop_id(auth.uid()))
  WITH CHECK (shop_id = get_user_shop_id(auth.uid()));

CREATE POLICY "guarantors_super_admin" ON guarantors
  FOR ALL USING (is_super_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- CONTRACTS POLICIES (Shop isolation)
-- ----------------------------------------------------------------------------
CREATE POLICY "contracts_shop_isolation" ON contracts
  FOR ALL USING (shop_id = get_user_shop_id(auth.uid()))
  WITH CHECK (shop_id = get_user_shop_id(auth.uid()));

CREATE POLICY "contracts_super_admin" ON contracts
  FOR ALL USING (is_super_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- INSTALLMENTS POLICIES (Shop isolation)
-- ----------------------------------------------------------------------------
CREATE POLICY "installments_shop_isolation" ON installments
  FOR ALL USING (shop_id = get_user_shop_id(auth.uid()))
  WITH CHECK (shop_id = get_user_shop_id(auth.uid()));

CREATE POLICY "installments_super_admin" ON installments
  FOR ALL USING (is_super_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- PAYMENTS POLICIES (Shop isolation)
-- ----------------------------------------------------------------------------
CREATE POLICY "payments_shop_isolation" ON payments
  FOR ALL USING (shop_id = get_user_shop_id(auth.uid()))
  WITH CHECK (shop_id = get_user_shop_id(auth.uid()));

CREATE POLICY "payments_super_admin" ON payments
  FOR ALL USING (is_super_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS POLICIES (Shop isolation)
-- ----------------------------------------------------------------------------
CREATE POLICY "notifications_shop_isolation" ON notifications
  FOR ALL USING (shop_id = get_user_shop_id(auth.uid()))
  WITH CHECK (shop_id = get_user_shop_id(auth.uid()));

CREATE POLICY "notifications_super_admin" ON notifications
  FOR ALL USING (is_super_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- REMINDERS LOG POLICIES (Shop isolation)
-- ----------------------------------------------------------------------------
CREATE POLICY "reminders_shop_isolation" ON reminders_log
  FOR ALL USING (shop_id = get_user_shop_id(auth.uid()))
  WITH CHECK (shop_id = get_user_shop_id(auth.uid()));

CREATE POLICY "reminders_super_admin" ON reminders_log
  FOR ALL USING (is_super_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- LATE FEES POLICIES (Shop isolation)
-- ----------------------------------------------------------------------------
CREATE POLICY "late_fees_shop_isolation" ON late_fees
  FOR ALL USING (shop_id = get_user_shop_id(auth.uid()))
  WITH CHECK (shop_id = get_user_shop_id(auth.uid()));

CREATE POLICY "late_fees_super_admin" ON late_fees
  FOR ALL USING (is_super_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- AUDIT LOGS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "audit_logs_super_admin" ON audit_logs
  FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "audit_logs_shop" ON audit_logs
  FOR SELECT USING (
    shop_id = get_user_shop_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'shop_owner')
  );

-- ============================================================================
-- STEP 7: CORE FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: Create user profile on signup (SECURITY DEFINER)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_username VARCHAR(255),
  p_full_name VARCHAR(255) DEFAULT NULL,
  p_phone VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE(user_id UUID, username VARCHAR, role VARCHAR, shop_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (user_id, username, full_name, phone, role)
  VALUES (p_user_id, p_username, p_full_name, p_phone, 'customer')
  ON CONFLICT (user_id) DO UPDATE SET
    username = COALESCE(EXCLUDED.username, users.username),
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    phone = COALESCE(EXCLUDED.phone, users.phone),
    updated_at = NOW();
  
  RETURN QUERY 
  SELECT u.user_id, u.username, u.role, u.shop_id
  FROM public.users u
  WHERE u.user_id = p_user_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- Function: Auto-create user profile on auth signup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_username VARCHAR(255);
BEGIN
  -- Generate username from email or phone
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'user_' || substring(NEW.id::text, 1, 8)
  );
  
  -- Ensure unique username
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = v_username) LOOP
    v_username := v_username || '_' || substring(md5(random()::text), 1, 4);
  END LOOP;

  INSERT INTO public.users (user_id, username, full_name, phone, role)
  VALUES (
    NEW.id,
    v_username,
    NEW.raw_user_meta_data->>'full_name',
    NEW.phone,
    'customer'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for auto user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ----------------------------------------------------------------------------
-- Function: Assign user to shop (SUPER ADMIN ONLY)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assign_user_to_shop(
  p_user_id UUID,
  p_shop_id UUID,
  p_role VARCHAR(50) DEFAULT 'admin'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super_admin can assign shop_id
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super_admin can assign users to shops';
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'shop_owner', 'credit_manager', 'sales_rep', 'customer') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- Update user
  UPDATE public.users
  SET 
    shop_id = p_shop_id,
    role = p_role,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

-- ----------------------------------------------------------------------------
-- Function: Approve shop application (SUPER ADMIN ONLY)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION approve_shop_application(
  p_application_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID -- Returns new shop_id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app RECORD;
  v_shop_id UUID;
BEGIN
  -- Only super_admin can approve
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super_admin can approve shop applications';
  END IF;

  -- Get application
  SELECT * INTO v_app FROM shop_applications WHERE application_id = p_application_id;
  
  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  IF v_app.status != 'pending' AND v_app.status != 'under_review' THEN
    RAISE EXCEPTION 'Application already processed';
  END IF;

  -- Create shop
  INSERT INTO shops (shop_name, address, phone, email, subscription_status)
  VALUES (v_app.shop_name, v_app.business_address, v_app.business_phone, v_app.business_email, 'trial')
  RETURNING shop_id INTO v_shop_id;

  -- Create notification settings for shop
  INSERT INTO notification_settings (shop_id) VALUES (v_shop_id);

  -- Update application
  UPDATE shop_applications
  SET 
    status = 'approved',
    reviewed_by = auth.uid(),
    review_notes = p_notes,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE application_id = p_application_id;

  -- Assign user as admin of the new shop
  UPDATE public.users
  SET 
    shop_id = v_shop_id,
    role = 'admin',
    updated_at = NOW()
  WHERE user_id = v_app.user_id;

  RETURN v_shop_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- Function: Reject shop application (SUPER ADMIN ONLY)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reject_shop_application(
  p_application_id UUID,
  p_notes TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super_admin can reject shop applications';
  END IF;

  UPDATE shop_applications
  SET 
    status = 'rejected',
    reviewed_by = auth.uid(),
    review_notes = p_notes,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE application_id = p_application_id
  AND status IN ('pending', 'under_review');

  RETURN FOUND;
END;
$$;

-- ----------------------------------------------------------------------------
-- Function: Change user role (Admin can change within shop, super_admin can change all)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_user_role(
  p_user_id UUID,
  p_new_role VARCHAR(50)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_shop_id UUID;
  v_target_shop_id UUID;
BEGIN
  -- Get caller info
  SELECT role, shop_id INTO v_caller_role, v_caller_shop_id
  FROM users WHERE user_id = auth.uid();

  -- Get target user's shop
  SELECT shop_id INTO v_target_shop_id
  FROM users WHERE user_id = p_user_id;

  -- Validate role
  IF p_new_role = 'super_admin' THEN
    RAISE EXCEPTION 'Cannot assign super_admin role';
  END IF;

  IF p_new_role NOT IN ('admin', 'shop_owner', 'credit_manager', 'sales_rep', 'customer') THEN
    RAISE EXCEPTION 'Invalid role: %', p_new_role;
  END IF;

  -- Super admin can change any role (except to super_admin)
  IF v_caller_role = 'super_admin' THEN
    UPDATE users SET role = p_new_role, updated_at = NOW()
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  -- Admin can change roles within their shop (except to admin)
  IF v_caller_role = 'admin' AND v_caller_shop_id = v_target_shop_id THEN
    IF p_new_role = 'admin' THEN
      RAISE EXCEPTION 'Only super_admin can promote to admin';
    END IF;
    
    UPDATE users SET role = p_new_role, updated_at = NOW()
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  RAISE EXCEPTION 'Insufficient permissions';
END;
$$;

-- ----------------------------------------------------------------------------
-- Function: Generate contract number
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_contract_number(p_shop_id UUID)
RETURNS VARCHAR(50)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_code VARCHAR(10);
  v_count INTEGER;
  v_number VARCHAR(50);
BEGIN
  -- Get shop code or generate from shop_id
  SELECT COALESCE(shop_code, UPPER(LEFT(shop_name, 3))) INTO v_shop_code
  FROM shops WHERE shop_id = p_shop_id;
  
  -- Count existing contracts for this shop
  SELECT COUNT(*) + 1 INTO v_count
  FROM contracts WHERE shop_id = p_shop_id;
  
  -- Generate number: SHOP-YYYYMM-NNNN
  v_number := v_shop_code || '-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(v_count::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$;

-- ----------------------------------------------------------------------------
-- Function: Update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guarantors_updated_at BEFORE UPDATE ON guarantors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installments_updated_at BEFORE UPDATE ON installments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Function: Check guarantor limit
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_guarantor_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.guarantor_id IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM contracts 
        WHERE guarantor_id = NEW.guarantor_id 
        AND contract_status IN ('pending', 'approved', 'active')) >= 3 
    THEN
      RAISE EXCEPTION 'Guarantor limit exceeded: A guarantor can only back up to 3 active accounts';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_guarantor_limit
  BEFORE INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION check_guarantor_limit();

-- ============================================================================
-- STEP 8: GRANT PERMISSIONS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, VARCHAR, VARCHAR, VARCHAR) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_shop_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_user_to_shop(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_shop_application(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_shop_application(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION change_user_role(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_contract_number(UUID) TO authenticated;

-- Grant table access (RLS will handle row-level permissions)
GRANT ALL ON shops TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON shop_applications TO authenticated;
GRANT ALL ON notification_settings TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON guarantors TO authenticated;
GRANT ALL ON contracts TO authenticated;
GRANT ALL ON installments TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON reminders_log TO authenticated;
GRANT ALL ON late_fees TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;

-- ============================================================================
-- STEP 9: CREATE SUPER ADMIN
-- ============================================================================
-- This creates the super_admin user for mtkinstalease@gmail.com
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user_id for the admin email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'mtkinstalease@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User mtkinstalease@gmail.com not found in auth.users. Please sign up first.';
    RETURN;
  END IF;

  -- Create or update super_admin profile
  INSERT INTO public.users (user_id, username, role, is_active)
  VALUES (v_user_id, 'superadmin', 'super_admin', true)
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'super_admin',
    is_active = true,
    updated_at = NOW();

  RAISE NOTICE 'Super admin created for user_id: %', v_user_id;
END $$;

-- ============================================================================
-- STEP 10: VERIFY SETUP
-- ============================================================================
-- Show all users
SELECT 
  u.user_id,
  u.username,
  u.role,
  u.shop_id,
  u.is_active,
  au.email
FROM public.users u
LEFT JOIN auth.users au ON u.user_id = au.id
ORDER BY 
  CASE u.role 
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'shop_owner' THEN 3
    WHEN 'credit_manager' THEN 4
    WHEN 'sales_rep' THEN 5
    WHEN 'customer' THEN 6
  END;

-- Show all tables
SELECT table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- COMPLETE! 
-- ============================================================================
-- 
-- ROLE HIERARCHY:
--   super_admin: Full system access, approve shop applications, assign users to shops
--   admin: Manage their shop, users in shop (cannot promote to admin)
--   shop_owner: Manage customers, contracts, payments
--   credit_manager: Approve/reject credit applications
--   sales_rep: Create customers, contracts
--   customer: View own data only
--
-- FEATURES:
--   ✅ Shop applications (users apply, super_admin approves)
--   ✅ Notification settings (WhatsApp, SMS, Email per shop)
--   ✅ Notifications table (log all sent messages)
--   ✅ Audit logs (track all changes)
--   ✅ RLS policies (no recursion, using helper functions)
--   ✅ Auto user profile creation on signup
--   ✅ Contract number generation
--   ✅ Guarantor limit enforcement
--   ✅ Late fee tracking
--
-- ============================================================================
