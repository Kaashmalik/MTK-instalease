# InstalEase

![InstalEase Logo](path/to/logo.png) <!-- Replace with actual logo path if available -->

## Overview

InstalEase is a SaaS (Software as a Service) platform developed by Malik Tech for managing installment plans in retail businesses, such as shops selling home appliances, mobile phones, and electronics. It enables shop owners to handle customer applications, guarantors, contracts, payments, reminders, and analytics efficiently. The system supports multi-tenancy, where the SaaS provider (admin) manages multiple shops, each with their own isolated data.

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- Supabase account (free tier available)
- Git

### Installation

1. **Clone the repository** (or use this project if starting fresh):
   ```bash
   git clone https://github.com/Malik-Tech-company/instalease.git
   cd instalease
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `env.example` to `.env.local`:
     ```bash
     cp env.example .env.local
     ```
   - Fill in your Supabase credentials:
     - Get your Supabase URL and keys from [Supabase Dashboard](https://app.supabase.com/project/_/settings/api)
     - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`

4. **Set up the database**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the migration file: `supabase/migrations/001_initial_schema.sql`
   - This will create all necessary tables, indexes, RLS policies, and triggers

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
instalease/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── auth/             # Auth components (Login, Signup)
│   │   └── ui/               # shadcn/ui components
│   ├── lib/                   # Utility libraries
│   │   └── supabase/         # Supabase client configuration
│   ├── providers/            # Context providers
│   ├── store/                # Zustand stores
│   └── __tests__/            # Unit tests
├── supabase/
│   └── migrations/           # Database migrations
├── e2e/                       # Playwright E2E tests
├── jest.config.js            # Jest configuration
├── playwright.config.ts      # Playwright configuration
└── package.json
```

## Tech Stack

- **Frontend**: Next.js 16 (React 19), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand (global state), TanStack Query (server state)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **Testing**: Jest (unit), Playwright (E2E), Artillery (load testing)
- **Monitoring**: Sentry (error tracking)
- **Deployment**: Vercel, GitHub Actions (CI/CD)
- **Responsive Design**: React Responsive

## Features Implemented

### ✅ Phase 1: Foundation

- [x] Next.js project setup with TypeScript and Tailwind
- [x] Supabase client configuration
- [x] Authentication system (email/phone login and signup)
- [x] Multi-tenancy setup with RLS policies
- [x] User profile management with RBAC
- [x] Zustand store for global auth state
- [x] Route protection middleware
- [x] Responsive design foundation
- [x] Testing infrastructure (Jest + Playwright)

## Database Schema

The database includes the following main tables:

- **shops**: Shop/tenant information
- **users**: User profiles with roles and shop associations
- **customers**: Customer information
- **guarantors**: Guarantor details
- **contracts**: Installment contracts
- **installments**: Payment schedule
- **payments**: Payment transactions
- **reminders_log**: Notification logs
- **late_fees**: Late fee tracking

All tables have Row Level Security (RLS) enabled to ensure data isolation between shops.

## Authentication

The app supports:
- Email/password authentication
- Phone/password authentication
- Role-based access control (admin, shop_owner, sales_rep, credit_manager, customer, guarantor)
- Session management with automatic refresh
- Protected routes via middleware

## Testing

### Unit Tests
```bash
npm run test
npm run test:watch
npm run test:coverage
```

### E2E Tests
```bash
npm run test:e2e
npm run test:e2e:ui  # Interactive UI mode
```

### Load Testing
```bash
npm run load-test          # Full load test suite
npm run load-test:quick    # Quick load test
```

### Production Verification
```bash
npm run verify:production  # Verify production deployment
```

## Development

### Adding New Components

1. Use shadcn/ui for base components:
   ```bash
   npx shadcn@latest add [component-name]
   ```

2. Create components in `src/components/`

3. Follow the existing JSDoc comment pattern

### Database Migrations

1. Create new migration files in `supabase/migrations/`
2. Run migrations in Supabase SQL Editor
3. Document schema changes in migration comments

## Environment Variables

See `env.example` for all required environment variables. Key variables:

### Development
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-side only)

### Production
- All development variables plus:
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry error tracking DSN
- `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`: Sentry configuration
- Production payment gateway keys (JazzCash, EasyPaisa, Raast)
- Production notification keys (Twilio, SMTP)

See `env.example` for complete list.

## Deployment

### Production Deployment

InstalEase is ready for production deployment! See the comprehensive deployment guides:

- **[Quick Deployment Steps](./DEPLOYMENT_STEPS.md)** - Quick reference for deploying
- **[Complete Deployment Guide](./DEPLOYMENT.md)** - Detailed deployment instructions
- **[Beta Testing Guide](./BETA_TESTING.md)** - Beta testing setup and management
- **[Security Audit Checklist](./SECURITY_AUDIT.md)** - Security verification

### Quick Deploy

1. Set up Vercel project and add environment variables
2. Configure Supabase production tier
3. Set up GitHub secrets for CI/CD
4. Push to `main` branch - automatic deployment!

See [DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md) for detailed instructions.

## Phase Summaries

- **[Phase 2 Summary](./PHASE2_SUMMARY.md)** - Core features implementation
- **[Phase 3 Summary](./PHASE3_SUMMARY.md)** - Polish & advanced features
- **[Phase 4 Summary](./PHASE4_SUMMARY.md)** - Production deployment & DevOps
- **[Changelog](./CHANGELOG.md)** - Version history and changes

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary (open-source base from Basejump, but custom extensions are closed-source).

## Support & Contact

- Email: support@maliktech.com
- Docs: https://docs.instalease.com

Thank you for using InstalEase! 🚀
