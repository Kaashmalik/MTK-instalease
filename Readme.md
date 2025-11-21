# InstalEase

![InstalEase Logo](path/to/logo.png) <!-- Replace with actual logo path if available -->

## Overview

InstalEase is a SaaS (Software as a Service) platform developed by Malik Tech for managing installment plans in retail businesses, such as shops selling home appliances, mobile phones, and electronics. It enables shop owners to handle customer applications, guarantors, contracts, payments, reminders, and analytics efficiently. The system supports multi-tenancy, where the SaaS provider (admin) manages multiple shops, each with their own isolated data.

Key highlights:
- **Target Users**: SaaS admins, shop owners, sales reps, credit managers, customers, and guarantors.
- **Core Functionality**: Customer onboarding with CNIC verification, contract generation, automated reminders (SMS/WhatsApp/Email), payment tracking, late fees, early settlements, and reporting.
- **Branding**: "InstalEase by Malik Tech" – Streamline Your Retail Installments.
- **Deployment**: Cloud-based with real-time features, scalable for small to medium retail chains.
- **License**: Proprietary (open-source base from Basejump, but custom extensions are closed-source).

This README is designed to be AI agent-friendly, providing a complete, phase-by-phase implementation plan using the primary tech stack choices. It includes detailed instructions, requirements, and modules for each phase. All aspects are covered, including replacements for payment integrations (JazzCash, EasyPaisa, and Raast ID instead of Stripe, as Stripe is not applicable in Pakistan). Phases are structured with clear steps, dependencies, and expected outputs to facilitate automated or step-by-step implementation by an AI agent.

## Features

### User-Facing Features
- **Multi-Tenant SaaS Structure**:
  - Admins (Malik Tech) add/manage shops.
  - Shops customize branding (name, logo).
- **Customer & Guarantor Management**:
  - Enter details (name, CNIC, phone, email, address, income).
  - Upload CNIC images (front/back) with OCR for auto-validation.
  - Digital signatures for guarantors.
  - Limits: Guarantors can back up to 3 active accounts.
- **Installment Applications & Contracts**:
  - Product selection with pricing.
  - Payment plans: Down payments, interest, fees, monthly installments.
  - Auto-calculations for totals, schedules, and debt-to-income ratios.
  - Approval workflow for credit managers.
  - Generate digital contracts with signatures and PDFs.
- **Payments & Tracking**:
  - Record payments (manual/online via JazzCash, EasyPaisa, Raast ID).
  - Apply late fees automatically.
  - Early settlement with discounts.
  - Payment history and receipts.
- **Automated Reminders**:
  - Timeline: 2 days before due (SMS), 1 day before (WhatsApp/Email), overdue escalations.
  - Sent to customers and guarantors.
  - Logs for delivery status.
- **Portals & Dashboards**:
  - **Customer Portal**: View balances, history, make payments.
  - **Shop Owner Dashboard**: CRUD operations, reports (outstanding, collection rates), analytics.
  - **Staff Panels**: Limited access for sales reps and credit managers.
- **Security & Compliance**:
  - Role-based access (RBAC).
  - Secure storage for documents.
  - Audit logs for changes.
- **Integrations**:
  - SMS/WhatsApp (Twilio).
  - Emails (Nodemailer).
  - Payments (JazzCash, EasyPaisa, Raast ID via their APIs or SDKs).

### Developer-Facing Features
- Built on modern stack for easy extension.
- Real-time updates (e.g., payment status).
- Customizable UI components.

## Tech Stack

InstalEase uses a robust, scalable stack focused on the React ecosystem with Supabase for backend services. Primary choices are prioritized for implementation.

### Frontend
- **Primary**: Next.js (React framework) – For SSR, API routes, and performance.
- **UI Library**: shadcn/ui with Tailwind CSS – For customizable components.
- **State Management**: TanStack Query (data fetching) + Zustand (global state).
- **Other**: React Responsive for mobile optimization.

### Backend/Database
- **Primary**: Supabase – For auth, database, storage, and edge functions.
- **Database**: PostgreSQL via Supabase.

### Authentication
- **Primary**: Supabase Auth – With email/phone/social logins, JWT, and RLS for multi-tenancy.

### Payments/Billing
- **Primary**: JazzCash, EasyPaisa, and Raast ID – Integrated for SaaS subscriptions (e.g., per-shop plans) and customer installment payments.
  - Use official APIs/SDKs for integration (no Stripe).
  - JazzCash: Use sandbox for testing; integrate via REST APIs for mobile wallet, card, and OTC payments.
  - EasyPaisa: Integrate via their merchant APIs for OTC, MA, CC, IBFT, QR, etc.; use sandbox accounts.
  - Raast ID: Integrate through participating bank APIs (e.g., via Allied Bank or others) for instant P2M payments; requires partnership with a Raast-enabled bank.
- **Custom Billing**: Implement manual subscription management in Supabase (e.g., track payments in DB) since no Stripe; handle recurring via cron jobs in edge functions.

### OCR for CNIC
- **Primary**: Tesseract.js – For client-side or edge function-based text extraction.

### Other Tools
- **Real-time**: Supabase Realtime – For live updates.
- **Analytics/Reports**: Chart.js or Recharts – For visualizations.
- **Notifications**: Twilio (SMS/WhatsApp), Nodemailer (emails).
- **Testing**: Jest (unit), Playwright (E2E).
- **Deployment**: Vercel (frontend), Supabase (backend). CI/CD with GitHub Actions.

## Database Structure

Use PostgreSQL via Supabase. Key tables (implement via SQL migrations):
- **Customers**: customer_id (PK), full_name, cnic_number, cnic_front_image_url, phone, email, address, monthly_income, shop_id (FK for multi-tenancy).
- **Guarantors**: guarantor_id (PK), customer_id (FK), full_name, cnic_number, phone, relationship_to_customer, digital_signature_url, active_guarantees_count.
- **Contracts**: contract_id (PK), customer_id (FK), guarantor_id (FK), product_name, down_payment, interest_rate, monthly_installment, contract_status.
- **Installments**: installment_id (PK), contract_id (FK), due_date, amount_due, payment_status, late_fee.
- **Payments**: payment_id (PK), contract_id (FK), amount, payment_date, paid_by_type (customer/guarantor), gateway (jazzcash/easypaisa/raast).
- **Reminders Log**: reminder_id (PK), contract_id (FK), sent_date, reminder_type, delivery_status.
- **Late Fees**: late_fee_id (PK), installment_id (FK), fee_amount, days_overdue.
- **Users/Staff**: user_id (PK), shop_id (FK), username, role (admin/sales_rep/etc.), last_login.
- **Shops**: shop_id (PK), shop_name, logo_url, subscription_status, subscription_gateway (jazzcash/easypaisa/raast).
- Apply RLS policies for data isolation between shops.

## Installation & Setup (General)

### Prerequisites
- Node.js v18+
- Yarn or npm
- Supabase account (free tier)
- Twilio account for notifications
- Accounts for JazzCash, EasyPaisa merchant integration (sandbox), and Raast via bank partner
- Git

### Steps
1. github rep link https://github.com/Malik-Tech-company/instalease.git
2. 
3. Env: Create `.env.local` with Supabase URL/key, Twilio SID, JazzCash MerchantID/Password, EasyPaisa credentials, Raast API keys.
4. DB Setup: Run migrations in Supabase dashboard.
5. Run: `npm run  dev (localhost:3000)

## AI Agent-Friendly Implementation Plan

This section provides a detailed, phase-by-phase plan for implementing the entire project. Each phase includes:
- **Duration Estimate**: Based on original plan.
- **Objectives**: High-level goals.
- **Dependencies**: Required setups or prior phases.
- **Modules**: Broken down into sub-modules with clear requirements, steps, and instructions.
- **Testing Requirements**: Unit/E2E checks.
- **Expected Outputs**: Deliverables.

Use primary stack choices. For payments, integrate JazzCash (via REST APIs: https://sandbox.jazzcash.com.pk/SandboxDocumentation/ApiReferences.html), EasyPaisa (via merchant guides: https://easypay.easypaisa.com.pk/easypay-merchant/faces/pg/site/IntegrationGuides.jsf), and Raast (via bank APIs, e.g., https://www.abl.com/personal/digital-banking-services/raast/; focus on instant transfers using ISO 20022 standards if available). Implement gateways with sandbox modes first. Handle callbacks/webhooks for payment confirmations in Next.js API routes.

### Phase 1: Foundation (1-2 Weeks)

**Objectives**: Set up base project with auth and multi-tenancy using Basejump boilerplate.

**Dependencies**: Supabase account, Git.

**Modules**:

1. **Project Setup**:
   - Steps: Start with Basejump (Supabase SaaS boilerplate: https://usebasejump.com/). Clone and initialize Next.js app.
   - Requirements: Install Next.js, shadcn/ui, Tailwind, TanStack Query, Zustand.
   - Instructions: Run `npx create-next-app@latest` if not using Basejump directly; add Supabase client: `yarn add @supabase/supabase-js`.
   - Output: Basic app structure with pages/home.

2. **Authentication Implementation**:
   - Steps: Integrate Supabase Auth for email/phone logins.
   - Requirements: Enable auth in Supabase dashboard; set up JWT and RLS.
   - Instructions: Create auth routes (/login, /signup); use Supabase hooks for session management. Implement RBAC with roles (admin, shop_owner, sales_rep, etc.) stored in users table.
   - Output: Functional login/signup with protected routes.

3. **Multi-Tenancy Setup**:
   - Steps: Configure RLS policies for shop isolation.
   - Requirements: Create shops table; associate users with shop_id.
   - Instructions: Use Supabase SQL editor to add RLS: e.g., `ALTER TABLE customers ENABLE ROW LEVEL SECURITY; CREATE POLICY "Shop isolation" ON customers FOR ALL USING (shop_id = (SELECT shop_id FROM users WHERE id = auth.uid()));`.
   - Output: Data isolation tested with multiple test shops.

**Testing Requirements**: Jest for auth utils; Playwright for login E2E.

**Expected Outputs**: Running local app with auth and basic multi-tenant DB.

### Phase 2: Core Features (4-6 Weeks)

**Objectives**: Build main user-facing modules, including forms, workflows, and integrations.

**Dependencies**: Phase 1 complete; payment merchant accounts.

**Modules**:

1. **Customer & Guarantor Management**:
   - Steps: Create forms for details entry; integrate OCR.
   - Requirements: Use shadcn/ui forms; store in Supabase storage for images.
   - Instructions: Implement /customers page with CRUD. For OCR: Install Tesseract.js (`yarn add tesseract.js`); run on uploaded CNIC images to extract text and validate. Enforce guarantor limit via trigger: `CREATE FUNCTION check_guarantor_limit() RETURNS trigger AS $$ BEGIN IF (SELECT active_guarantees_count FROM guarantors WHERE guarantor_id = NEW.guarantor_id) >= 3 THEN RAISE EXCEPTION 'Guarantor limit exceeded'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;`.
   - Output: Functional management dashboard.

2. **Installment Applications & Contracts**:
   - Steps: Build application workflow; generate PDFs.
   - Requirements: Use TanStack Query for data fetching; pdf-lib for contract generation (`yarn add pdf-lib`).
   - Instructions: Create /applications page; auto-calculate plans (e.g., total = down_payment + (monthly_installment * months) + interest). Implement approval workflow with email notifications via Nodemailer. Add digital signatures using canvas or library like react-signature-canvas.
   - Output: End-to-end application creation and approval.

3. **Payments & Tracking**:
   - Steps: Integrate payment gateways; track history.
   - Requirements: No Stripe; use JazzCash/EasyPaisa/Raast.
   - Instructions: 
     - JazzCash: Use REST APIs (e.g., POST to /DirectPay for immediate payments). Generate secure hash for auth. Handle redirects/callbacks in Next.js API route (/api/payment/jazzcash-callback).
     - EasyPaisa: Use MA/CC/OTC methods; POST to their endpoint with params like storeId, amount, postBackURL. Sandbox: Activate via merchant portal.
     - Raast: Integrate via bank SDK (e.g., Allied Bank Raast API for fund transfers). Use P2M flows; require user Raast ID for payments.
     - Custom: Store payment status in DB; apply late fees via edge function cron (e.g., daily check overdue installments).
     - Early settlements: Calculate discount (e.g., 5% off remaining) on payment.
   - Output: Payment buttons leading to gateway redirects; webhook updates.

4. **Automated Reminders**:
   - Steps: Schedule notifications.
   - Requirements: Twilio for SMS/WhatsApp; Nodemailer for email.
   - Instructions: Use Supabase edge functions for scheduling (cron-like). Query due installments; send 2 days before: Twilio SMS, 1 day: WhatsApp/Email. Log in reminders_log table. Handle escalations for overdue.
   - Output: Tested reminder flows.

**Testing Requirements**: Mock gateways for unit tests; E2E for payment flows (sandbox).

**Expected Outputs**: Core CRUD and workflows functional; payments testable in sandbox.

### Phase 3: Polish (2-4 Weeks)

**Objectives**: Add advanced features, UI/UX refinements, and testing.

**Dependencies**: Phase 2 complete.

**Modules**:

1. **Portals & Dashboards**:
   - Steps: Build user-specific views.
   - Requirements: Use Recharts for charts; Zustand for state.
   - Instructions: Customer portal: Protected page showing balances (query contracts/installments). Shop dashboard: Reports with filters (outstanding = SUM(unpaid installments)). Staff panels: RBAC-limited views.
   - Output: Interactive dashboards.

2. **Security & Compliance**:
   - Steps: Implement audits and secure storage.
   - Requirements: Supabase storage with signed URLs.
   - Instructions: Add audit logs via triggers: Log changes to sensitive tables. Enforce RBAC in API routes.
   - Output: Secure, logged system.

3. **Real-Time & Analytics**:
   - Steps: Enable live updates.
   - Requirements: Supabase Realtime.
   - Instructions: Subscribe to DB changes (e.g., payment updates trigger dashboard refresh). Add analytics: Collection rates = (paid / total) * 100.
   - Output: Real-time dashboards.

4. **UI Refinements & Mobile Optimization**:
   - Steps: Polish components.
   - Requirements: React Responsive.
   - Instructions: Ensure responsive design; customize shadcn/ui themes in tailwind.config.js.
   - Output: Polished, mobile-friendly UI.

**Testing Requirements**: Full coverage with Jest/Playwright; security scans.

**Expected Outputs**: Complete, tested app ready for beta.

### Phase 4: Launch

**Objectives**: Deploy, test, and monitor.

**Dependencies**: All phases.

**Modules**:

1. **Deployment**:
   - Steps: Push to Vercel/Supabase.
   - Requirements: Env vars in platforms.
   - Instructions: Connect Git to Vercel; promote Supabase project to prod. Set up CI/CD: GitHub Actions for tests/deploy.
   - Output: Live at https://app.instalease.com.

2. **Beta Testing & Monitoring**:
   - Steps: Invite users; monitor.
   - Requirements: Supabase analytics; error tracking (Sentry?).
   - Instructions: Run beta with shop owners; fix issues. Monitor payments/logs.
   - Output: Stable production app.

**Testing Requirements**: Load testing; user feedback.

**Expected Outputs**: Launched app with changelog v1.0.

## Contributing
Fork, branch, commit, PR as per original.

## Support & Contact
Email: support@maliktech.com
Docs: https://docs.instalease.com

Thank you for using InstalEase! 🚀