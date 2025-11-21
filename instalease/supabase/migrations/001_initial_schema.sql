-- InstalEase Database Schema
-- Multi-tenant SaaS platform for managing installment plans
-- Run this migration in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SHOPS TABLE
-- ============================================================================
-- Stores shop/tenant information for multi-tenancy
CREATE TABLE IF NOT EXISTS shops (
  shop_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  subscription_status VARCHAR(50) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  subscription_gateway VARCHAR(50) CHECK (subscription_gateway IN ('jazzcash', 'easypaisa', 'raast', NULL)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Extends Supabase auth.users with additional role and shop association
-- Links to Supabase auth.users via id (UUID)
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(shop_id) ON DELETE CASCADE,
  username VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'sales_rep' CHECK (role IN ('admin', 'shop_owner', 'sales_rep', 'credit_manager', 'customer', 'guarantor')),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================
-- Stores customer information for installment applications
CREATE TABLE IF NOT EXISTS customers (
  customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  cnic_number VARCHAR(13) NOT NULL,
  cnic_front_image_url TEXT,
  cnic_back_image_url TEXT,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  monthly_income DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, cnic_number)
);

-- ============================================================================
-- GUARANTORS TABLE
-- ============================================================================
-- Stores guarantor information linked to customers
CREATE TABLE IF NOT EXISTS guarantors (
  guarantor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  cnic_number VARCHAR(13) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  relationship_to_customer VARCHAR(100),
  digital_signature_url TEXT,
  active_guarantees_count INTEGER DEFAULT 0 CHECK (active_guarantees_count <= 3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CONTRACTS TABLE
-- ============================================================================
-- Stores installment contracts/agreements
CREATE TABLE IF NOT EXISTS contracts (
  contract_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  guarantor_id UUID REFERENCES guarantors(guarantor_id) ON DELETE SET NULL,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(12, 2) NOT NULL,
  down_payment DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  monthly_installment DECIMAL(12, 2) NOT NULL,
  total_months INTEGER NOT NULL,
  contract_status VARCHAR(50) DEFAULT 'pending' CHECK (contract_status IN ('pending', 'approved', 'active', 'completed', 'cancelled', 'defaulted')),
  contract_pdf_url TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INSTALLMENTS TABLE
-- ============================================================================
-- Stores individual installment payment schedules
CREATE TABLE IF NOT EXISTS installments (
  installment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount_due DECIMAL(12, 2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'waived')),
  late_fee DECIMAL(12, 2) DEFAULT 0,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contract_id, installment_number)
);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
-- Records all payment transactions
CREATE TABLE IF NOT EXISTS payments (
  payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
  installment_id UUID REFERENCES installments(installment_id) ON DELETE SET NULL,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_by_type VARCHAR(50) NOT NULL CHECK (paid_by_type IN ('customer', 'guarantor')),
  gateway VARCHAR(50) NOT NULL CHECK (gateway IN ('jazzcash', 'easypaisa', 'raast', 'manual', 'cash')),
  transaction_id VARCHAR(255),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- REMINDERS LOG TABLE
-- ============================================================================
-- Tracks automated reminder notifications
CREATE TABLE IF NOT EXISTS reminders_log (
  reminder_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
  installment_id UUID REFERENCES installments(installment_id) ON DELETE SET NULL,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  sent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('sms', 'whatsapp', 'email')),
  recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('customer', 'guarantor', 'both')),
  delivery_status VARCHAR(50) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- LATE FEES TABLE
-- ============================================================================
-- Tracks late fee charges applied to overdue installments
CREATE TABLE IF NOT EXISTS late_fees (
  late_fee_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  installment_id UUID NOT NULL REFERENCES installments(installment_id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  fee_amount DECIMAL(12, 2) NOT NULL,
  days_overdue INTEGER NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_shop_id ON users(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_cnic ON customers(cnic_number);
CREATE INDEX IF NOT EXISTS idx_guarantors_customer_id ON guarantors(customer_id);
CREATE INDEX IF NOT EXISTS idx_guarantors_shop_id ON guarantors(shop_id);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_shop_id ON contracts(shop_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(contract_status);
CREATE INDEX IF NOT EXISTS idx_installments_contract_id ON installments(contract_id);
CREATE INDEX IF NOT EXISTS idx_installments_shop_id ON installments(shop_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_shop_id ON payments(shop_id);
CREATE INDEX IF NOT EXISTS idx_reminders_contract_id ON reminders_log(contract_id);
CREATE INDEX IF NOT EXISTS idx_reminders_shop_id ON reminders_log(shop_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE late_fees ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SHOPS POLICIES
-- ============================================================================
-- Admins can see all shops, shop owners can see their own shop
CREATE POLICY "Admins can view all shops" ON shops
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Shop owners can view their own shop" ON shops
  FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
    )
  );

-- ============================================================================
-- USERS POLICIES
-- ============================================================================
-- Users can view their own user record
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own profile (except role and shop_id)
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.user_id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Shop owners can view users in their shop
CREATE POLICY "Shop owners can view shop users" ON users
  FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
      AND users.role IN ('admin', 'shop_owner')
    )
  );

-- ============================================================================
-- CUSTOMERS POLICIES
-- ============================================================================
-- Shop isolation: Users can only access customers from their shop
CREATE POLICY "Shop isolation for customers" ON customers
  FOR ALL
  USING (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
    )
  );

-- ============================================================================
-- GUARANTORS POLICIES
-- ============================================================================
-- Shop isolation for guarantors
CREATE POLICY "Shop isolation for guarantors" ON guarantors
  FOR ALL
  USING (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
    )
  );

-- ============================================================================
-- CONTRACTS POLICIES
-- ============================================================================
-- Shop isolation for contracts
CREATE POLICY "Shop isolation for contracts" ON contracts
  FOR ALL
  USING (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
    )
  );

-- ============================================================================
-- INSTALLMENTS POLICIES
-- ============================================================================
-- Shop isolation for installments
CREATE POLICY "Shop isolation for installments" ON installments
  FOR ALL
  USING (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PAYMENTS POLICIES
-- ============================================================================
-- Shop isolation for payments
CREATE POLICY "Shop isolation for payments" ON payments
  FOR ALL
  USING (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
    )
  );

-- ============================================================================
-- REMINDERS LOG POLICIES
-- ============================================================================
-- Shop isolation for reminders
CREATE POLICY "Shop isolation for reminders" ON reminders_log
  FOR ALL
  USING (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
    )
  );

-- ============================================================================
-- LATE FEES POLICIES
-- ============================================================================
-- Shop isolation for late fees
CREATE POLICY "Shop isolation for late fees" ON late_fees
  FOR ALL
  USING (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to check guarantor limit (max 3 active guarantees)
CREATE OR REPLACE FUNCTION check_guarantor_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM contracts 
      WHERE guarantor_id = NEW.guarantor_id 
      AND contract_status IN ('pending', 'approved', 'active')) >= 3 
  THEN
    RAISE EXCEPTION 'Guarantor limit exceeded: A guarantor can only back up to 3 active accounts';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce guarantor limit
CREATE TRIGGER trigger_check_guarantor_limit
  BEFORE INSERT OR UPDATE ON contracts
  FOR EACH ROW
  WHEN (NEW.guarantor_id IS NOT NULL)
  EXECUTE FUNCTION check_guarantor_limit();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
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

-- ============================================================================
-- INITIAL DATA (Optional - for testing)
-- ============================================================================
-- Insert a default admin shop (you can customize this)
-- INSERT INTO shops (shop_id, shop_name, subscription_status) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'Malik Tech Admin', 'active');

