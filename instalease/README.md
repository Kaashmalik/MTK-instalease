# 🚀 InstalEase

<div align="center">

![InstalEase Banner](https://img.shields.io/badge/InstalEase-v2.0-7C3AED?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDJMMyA3djEwbDkgNSA5LTVWN2wtOS01eiIvPjwvc3ZnPg==)

**Streamline Your Installment Business**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](LICENSE)

[Demo](https://instalease.mtkcodex.site) • [Documentation](https://docs.mtkcodex.site) • [Report Bug](https://github.com/Kaashmalik/MTK-instalease/issues)

</div>

---

## 🏢 About

**Developed by:** [MALIK TECH](https://mtkcodex.site) (MTKCODEX.SITE)  
**Developer:** Malik Kashif  
**Website:** [https://mtkcodex.site](https://mtkcodex.site)

---

## 📋 Overview

InstalEase is a comprehensive **SaaS (Software as a Service)** platform developed by **MALIK TECH** for managing installment plans in retail businesses. Perfect for shops selling home appliances, mobile phones, electronics, and furniture.

### ✨ Key Highlights

- 🏪 **Multi-tenant Architecture** - One platform, unlimited shops
- 📱 **Fully Responsive** - Works on desktop, tablet, and mobile
- 🔐 **Enterprise Security** - Row Level Security (RLS) with role-based access
- 📊 **Real-time Analytics** - Live dashboards with charts and metrics
- 💳 **Payment Tracking** - Automated installment and payment management
- 🔔 **Smart Notifications** - WhatsApp, SMS, and Email reminders
- 🎨 **Modern UI/UX** - Beautiful, intuitive interface with dark mode support

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Supabase** account (free tier available)
- **Git**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Kaashmalik/MTK-instalease.git
   cd MTK-instalease
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

## ✨ Features Implemented

### ✅ Phase 1: Foundation
- [x] Next.js 14 project with TypeScript and Tailwind CSS
- [x] Supabase client configuration with real-time subscriptions
- [x] Authentication system (email/phone login and signup)
- [x] Multi-tenancy setup with Row Level Security (RLS)
- [x] User profile management with RBAC
- [x] Zustand store for global auth state
- [x] Route protection middleware
- [x] Responsive design foundation
- [x] Testing infrastructure (Jest + Playwright)

### ✅ Phase 2: Core Features
- [x] Customer management with CNIC verification
- [x] Contract creation and management
- [x] Installment scheduling and tracking
- [x] Payment recording and receipts
- [x] Guarantor management
- [x] Dashboard analytics with Recharts
- [x] Real-time data updates

### ✅ Phase 3: Advanced Features
- [x] Super Admin dashboard for platform management
- [x] Shop application workflow with payment verification
- [x] Multi-step shop registration with plan selection
- [x] Payment slip upload and manual verification
- [x] User settings with theme customization
- [x] Notification preferences (WhatsApp, SMS, Email)
- [x] Subscription plans (Basic, Professional, Enterprise)
- [x] Fully responsive mobile-first design

### ✅ Phase 4: Production Ready
- [x] Enterprise-grade security with RLS policies
- [x] Role-based access control (6 roles)
- [x] Storage buckets for file uploads
- [x] Error handling and loading states
- [x] Production deployment configuration

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

## 🔐 Authentication & Security

The app supports:
- 📧 Email/password authentication
- 📱 Phone/password authentication
- 👥 Role-based access control:
  - `super_admin` - Platform-wide access
  - `admin` - Shop administration
  - `shop_owner` - Shop management
  - `credit_manager` - Credit operations
  - `sales_rep` - Sales operations
  - `customer` - Customer portal
- 🔄 Session management with automatic refresh
- 🛡️ Protected routes via middleware
- 🔒 Row Level Security (RLS) for data isolation

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

## 📸 Screenshots

### Super Admin Dashboard
- Manage all shops from one central location
- Verify payment slips and approve applications
- Monitor platform-wide analytics

### Shop Owner Dashboard
- Real-time revenue analytics
- Contract status distribution
- Quick action buttons

### Mobile Responsive
- Full functionality on all devices
- Touch-friendly interface
- Optimized for mobile workflows

---

## 🎬 Demo Video

See `AI_VIDEO_DEMO_PROMPT.md` for AI video generation instructions with brand guidelines.

---

## 📡 Support & Contact

<div align="center">

**MALIK TECH** (MTKCODEX.SITE)

| Channel | Contact |
|---------|--------|
| 🌐 Website | [mtkcodex.site](https://mtkcodex.site) |
| 📧 Email | contact@mtkcodex.site |
| 👨‍💻 Developer | Malik Kashif |
| 🐙 GitHub | [@Kaashmalik](https://github.com/Kaashmalik) |

</div>

---

<div align="center">

**Made with ❤️ by [MALIK TECH](https://mtkcodex.site)**

© 2024 MALIK TECH. All rights reserved.

</div>

Thank you for using InstalEase! 🚀
