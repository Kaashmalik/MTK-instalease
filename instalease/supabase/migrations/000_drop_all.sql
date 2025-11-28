-- ============================================================================
-- DROP ALL - FRESH DATABASE RESET
-- ============================================================================
-- WARNING: This script will DELETE ALL DATA and database objects!
-- Use this to start fresh before running migrations
-- Run this in Supabase SQL Editor BEFORE running 001_initial_schema.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS audit_shops_trigger ON shops;
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
DROP TRIGGER IF EXISTS audit_customers_trigger ON customers;
DROP TRIGGER IF EXISTS audit_contracts_trigger ON contracts;
DROP TRIGGER IF EXISTS audit_payments_trigger ON payments;

DROP TRIGGER IF EXISTS trigger_check_guarantor_limit ON contracts;
DROP TRIGGER IF EXISTS update_shops_updated_at ON shops;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_guarantors_updated_at ON guarantors;
DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
DROP TRIGGER IF EXISTS update_installments_updated_at ON installments;
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;

-- ============================================================================
-- STEP 2: DROP ALL FUNCTIONS
-- ============================================================================
DROP FUNCTION IF EXISTS create_user_profile(UUID, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS check_guarantor_limit();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS audit_trigger_function();
DROP FUNCTION IF EXISTS audit_shops_trigger();
DROP FUNCTION IF EXISTS audit_users_trigger();
DROP FUNCTION IF EXISTS audit_customers_trigger();
DROP FUNCTION IF EXISTS audit_contracts_trigger();
DROP FUNCTION IF EXISTS audit_payments_trigger();

-- ============================================================================
-- STEP 3: DROP ALL POLICIES (RLS)
-- ============================================================================
-- Drop policies on all tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on shops
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'shops') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON shops';
    END LOOP;
    
    -- Drop all policies on users
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON users';
    END LOOP;
    
    -- Drop all policies on customers
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'customers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON customers';
    END LOOP;
    
    -- Drop all policies on guarantors
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'guarantors') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON guarantors';
    END LOOP;
    
    -- Drop all policies on contracts
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'contracts') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON contracts';
    END LOOP;
    
    -- Drop all policies on installments
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'installments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON installments';
    END LOOP;
    
    -- Drop all policies on payments
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'payments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON payments';
    END LOOP;
    
    -- Drop all policies on reminders_log
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'reminders_log') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON reminders_log';
    END LOOP;
    
    -- Drop all policies on late_fees
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'late_fees') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON late_fees';
    END LOOP;
    
    -- Drop all policies on audit_logs
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'audit_logs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON audit_logs';
    END LOOP;
END $$;

-- ============================================================================
-- STEP 4: DROP ALL TABLES (in correct order to respect foreign keys)
-- ============================================================================
-- Drop tables that have foreign keys first, then referenced tables

-- Drop audit_logs first (references users and shops)
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Drop tables with foreign keys to other tables
DROP TABLE IF EXISTS late_fees CASCADE;
DROP TABLE IF EXISTS reminders_log CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS installments CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS guarantors CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Drop users table (references auth.users and shops)
DROP TABLE IF EXISTS users CASCADE;

-- Drop shops table last (referenced by users and other tables)
DROP TABLE IF EXISTS shops CASCADE;

-- ============================================================================
-- STEP 5: DROP INDEXES (if any remain)
-- ============================================================================
-- Most indexes are dropped automatically with tables, but just in case:
DROP INDEX IF EXISTS idx_users_shop_id;
DROP INDEX IF EXISTS idx_customers_shop_id;
DROP INDEX IF EXISTS idx_customers_cnic;
DROP INDEX IF EXISTS idx_guarantors_customer_id;
DROP INDEX IF EXISTS idx_guarantors_shop_id;
DROP INDEX IF EXISTS idx_contracts_customer_id;
DROP INDEX IF EXISTS idx_contracts_shop_id;
DROP INDEX IF EXISTS idx_contracts_status;
DROP INDEX IF EXISTS idx_installments_contract_id;
DROP INDEX IF EXISTS idx_installments_shop_id;
DROP INDEX IF EXISTS idx_installments_due_date;
DROP INDEX IF EXISTS idx_installments_status;
DROP INDEX IF EXISTS idx_payments_contract_id;
DROP INDEX IF EXISTS idx_payments_shop_id;
DROP INDEX IF EXISTS idx_reminders_contract_id;
DROP INDEX IF EXISTS idx_reminders_shop_id;
DROP INDEX IF EXISTS idx_audit_logs_table_record;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_shop_id;
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_audit_logs_operation;

-- ============================================================================
-- STEP 6: DISABLE RLS (if any tables still exist)
-- ============================================================================
ALTER TABLE IF EXISTS shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS guarantors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS installments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reminders_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS late_fees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION: Check what remains
-- ============================================================================
-- Run these queries to verify everything is dropped:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('shops', 'users', 'customers', 'guarantors', 'contracts', 'installments', 'payments', 'reminders_log', 'late_fees', 'audit_logs');
-- SELECT proname FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND proname LIKE '%audit%' OR proname LIKE '%guarantor%' OR proname LIKE '%updated_at%' OR proname LIKE '%user_profile%';

-- ============================================================================
-- COMPLETE: Database is now clean and ready for fresh migrations
-- ============================================================================
-- Next steps:
-- 1. Run 001_initial_schema.sql
-- 2. Run 002_audit_logs.sql
-- ============================================================================

