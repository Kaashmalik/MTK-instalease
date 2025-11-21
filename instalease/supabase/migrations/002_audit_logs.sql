-- InstalEase Audit Logs Migration
-- Creates audit_logs table and triggers to track all data changes
-- Run this migration in your Supabase SQL Editor after 001_initial_schema.sql

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
-- Stores comprehensive audit trail of all data changes for compliance and security
CREATE TABLE IF NOT EXISTS audit_logs (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_shop_id ON audit_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);

-- ============================================================================
-- AUDIT LOG FUNCTION
-- ============================================================================
-- Generic function to log changes to any table
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_shop_id UUID;
  v_changed_fields TEXT[];
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  -- Get current user ID from auth context
  v_user_id := auth.uid();
  
  -- Try to get shop_id from the record being modified
  -- Handle different table structures
  IF TG_TABLE_NAME = 'users' THEN
    v_shop_id := COALESCE(NEW.shop_id, OLD.shop_id);
  ELSIF TG_TABLE_NAME IN ('customers', 'guarantors', 'contracts', 'installments', 'payments', 'reminders_log', 'late_fees') THEN
    v_shop_id := COALESCE(NEW.shop_id, OLD.shop_id);
  ELSIF TG_TABLE_NAME = 'shops' THEN
    v_shop_id := COALESCE(NEW.shop_id, OLD.shop_id);
  END IF;

  -- Handle INSERT operation
  IF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    INSERT INTO audit_logs (
      table_name,
      record_id,
      operation,
      user_id,
      shop_id,
      new_data
    ) VALUES (
      TG_TABLE_NAME,
      (NEW.id::text::uuid)::uuid, -- Try common ID column names
      'INSERT',
      v_user_id,
      v_shop_id,
      v_new_data
    );
    RETURN NEW;
  END IF;

  -- Handle UPDATE operation
  IF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    
    -- Calculate changed fields
    SELECT array_agg(key)
    INTO v_changed_fields
    FROM jsonb_each(v_new_data)
    WHERE value IS DISTINCT FROM (v_old_data->key);

    INSERT INTO audit_logs (
      table_name,
      record_id,
      operation,
      user_id,
      shop_id,
      old_data,
      new_data,
      changed_fields
    ) VALUES (
      TG_TABLE_NAME,
      (NEW.id::text::uuid)::uuid,
      'UPDATE',
      v_user_id,
      v_shop_id,
      v_old_data,
      v_new_data,
      v_changed_fields
    );
    RETURN NEW;
  END IF;

  -- Handle DELETE operation
  IF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    
    -- Try to get shop_id from OLD record
    IF TG_TABLE_NAME = 'users' THEN
      v_shop_id := OLD.shop_id;
    ELSIF TG_TABLE_NAME IN ('customers', 'guarantors', 'contracts', 'installments', 'payments', 'reminders_log', 'late_fees') THEN
      v_shop_id := OLD.shop_id;
    ELSIF TG_TABLE_NAME = 'shops' THEN
      v_shop_id := OLD.shop_id;
    END IF;

    INSERT INTO audit_logs (
      table_name,
      record_id,
      operation,
      user_id,
      shop_id,
      old_data
    ) VALUES (
      TG_TABLE_NAME,
      (OLD.id::text::uuid)::uuid,
      'DELETE',
      v_user_id,
      v_shop_id,
      v_old_data
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SPECIFIC AUDIT TRIGGER FUNCTIONS FOR EACH TABLE
-- ============================================================================
-- These functions handle table-specific ID column names

-- Function for shops table
CREATE OR REPLACE FUNCTION audit_shops_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_shop_id UUID;
  v_changed_fields TEXT[];
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  v_user_id := auth.uid();
  v_shop_id := COALESCE(NEW.shop_id, OLD.shop_id);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, operation, user_id, shop_id, new_data)
    VALUES ('shops', NEW.shop_id, 'INSERT', v_user_id, v_shop_id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    SELECT array_agg(key) INTO v_changed_fields
    FROM jsonb_each(v_new_data)
    WHERE value IS DISTINCT FROM (v_old_data->key);
    INSERT INTO audit_logs (table_name, record_id, operation, user_id, shop_id, old_data, new_data, changed_fields)
    VALUES ('shops', NEW.shop_id, 'UPDATE', v_user_id, v_shop_id, v_old_data, v_new_data, v_changed_fields);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, operation, user_id, shop_id, old_data)
    VALUES ('shops', OLD.shop_id, 'DELETE', v_user_id, OLD.shop_id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for users table
CREATE OR REPLACE FUNCTION audit_users_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_shop_id UUID;
  v_changed_fields TEXT[];
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  v_user_id := auth.uid();
  v_shop_id := COALESCE(NEW.shop_id, OLD.shop_id);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, operation, user_id, shop_id, new_data)
    VALUES ('users', NEW.user_id, 'INSERT', v_user_id, v_shop_id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    SELECT array_agg(key) INTO v_changed_fields
    FROM jsonb_each(v_new_data)
    WHERE value IS DISTINCT FROM (v_old_data->key);
    INSERT INTO audit_logs (table_name, record_id, operation, user_id, shop_id, old_data, new_data, changed_fields)
    VALUES ('users', NEW.user_id, 'UPDATE', v_user_id, v_shop_id, v_old_data, v_new_data, v_changed_fields);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, operation, user_id, shop_id, old_data)
    VALUES ('users', OLD.user_id, 'DELETE', v_user_id, OLD.shop_id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for customers table
CREATE OR REPLACE FUNCTION audit_customers_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_shop_id UUID;
  v_changed_fields TEXT[];
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  v_user_id := auth.uid();
  v_shop_id := COALESCE(NEW.shop_id, OLD.shop_id);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, operation, user_id, shop_id, new_data)
    VALUES ('customers', NEW.customer_id, 'INSERT', v_user_id, v_shop_id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    SELECT array_agg(key) INTO v_changed_fields
    FROM jsonb_each(v_new_data)
    WHERE value IS DISTINCT FROM (v_old_data->key);
    INSERT INTO audit_logs (table_name, record_id, operation, user_id, shop_id, old_data, new_data, changed_fields)
    VALUES ('customers', NEW.customer_id, 'UPDATE', v_user_id, v_shop_id, v_old_data, v_new_data, v_changed_fields);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, operation, user_id, shop_id, old_data)
    VALUES ('customers', OLD.customer_id, 'DELETE', v_user_id, OLD.shop_id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for contracts table
CREATE OR REPLACE FUNCTION audit_contracts_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_shop_id UUID;
  v_changed_fields TEXT[];
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  v_user_id := auth.uid();
  v_shop_id := COALESCE(NEW.shop_id, OLD.shop_id);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, operation, user_id, shop_id, new_data)
    VALUES ('contracts', NEW.contract_id, 'INSERT', v_user_id, v_shop_id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    SELECT array_agg(key) INTO v_changed_fields
    FROM jsonb_each(v_new_data)
    WHERE value IS DISTINCT FROM (v_old_data->key);
    INSERT INTO audit_logs (table_name, record_id, operation, user_id, shop_id, old_data, new_data, changed_fields)
    VALUES ('contracts', NEW.contract_id, 'UPDATE', v_user_id, v_shop_id, v_old_data, v_new_data, v_changed_fields);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, operation, user_id, shop_id, old_data)
    VALUES ('contracts', OLD.contract_id, 'DELETE', v_user_id, OLD.shop_id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for payments table (critical for financial audit)
CREATE OR REPLACE FUNCTION audit_payments_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_shop_id UUID;
  v_changed_fields TEXT[];
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  v_user_id := auth.uid();
  v_shop_id := COALESCE(NEW.shop_id, OLD.shop_id);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, operation, user_id, shop_id, new_data)
    VALUES ('payments', NEW.payment_id, 'INSERT', v_user_id, v_shop_id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    SELECT array_agg(key) INTO v_changed_fields
    FROM jsonb_each(v_new_data)
    WHERE value IS DISTINCT FROM (v_old_data->key);
    INSERT INTO audit_logs (table_name, record_id, operation, user_id, shop_id, old_data, new_data, changed_fields)
    VALUES ('payments', NEW.payment_id, 'UPDATE', v_user_id, v_shop_id, v_old_data, v_new_data, v_changed_fields);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, operation, user_id, shop_id, old_data)
    VALUES ('payments', OLD.payment_id, 'DELETE', v_user_id, OLD.shop_id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================
-- Enable audit logging on critical tables

CREATE TRIGGER audit_shops_trigger
  AFTER INSERT OR UPDATE OR DELETE ON shops
  FOR EACH ROW EXECUTE FUNCTION audit_shops_trigger();

CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_users_trigger();

CREATE TRIGGER audit_customers_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_customers_trigger();

CREATE TRIGGER audit_contracts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON contracts
  FOR EACH ROW EXECUTE FUNCTION audit_contracts_trigger();

CREATE TRIGGER audit_payments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION audit_payments_trigger();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) FOR AUDIT LOGS
-- ============================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Shop owners can view audit logs for their shop
CREATE POLICY "Shop owners can view shop audit logs" ON audit_logs
  FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM users
      WHERE users.user_id = auth.uid()
      AND users.role IN ('admin', 'shop_owner')
    )
  );

-- Users can view their own audit logs (where they are the user_id)
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- RETENTION POLICY (Optional - for compliance)
-- ============================================================================
-- Consider adding a function to archive old audit logs after a retention period
-- This is a placeholder - implement based on your compliance requirements

-- Example: Function to archive audit logs older than 7 years
-- CREATE OR REPLACE FUNCTION archive_old_audit_logs()
-- RETURNS void AS $$
-- BEGIN
--   -- Move logs older than 7 years to archive table or delete
--   -- DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '7 years';
-- END;
-- $$ LANGUAGE plpgsql;

