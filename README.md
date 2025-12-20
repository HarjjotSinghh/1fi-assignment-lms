# Fiquity Technology - Loan Management System

A modern, full-stack **Loan Management System** for **NBFC** (Non-Banking Financial Company) specializing in **LAMF** (Lending Against Mutual Funds).

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green)
![Turso](https://img.shields.io/badge/Turso-SQLite-orange)

## 🚀 Features

### Core Modules

1. **Dashboard** - Overview of all metrics, quick actions, and getting started guide
2. **Loan Products** - Create and manage loan products with interest rates, tenure, and LTV settings
3. **Loan Applications** - Track applications from submission to disbursement
4. **Active Loans** - Monitor active loans, LTV ratios, and EMI schedules
5. **Collateral Management** - Track pledged mutual fund units, NAV, and valuations
6. **Customer Management** - KYC-verified customer profiles with Aadhaar/PAN verification
7. **Analytics** - Visual reports on portfolio health, disbursement trends, and risk metrics
8. **Approvals** - Workflow for loan approval, overrides, and sensitive actions
9. **Audit Trail** - Complete history of all system actions for compliance

### Customer Onboarding

Complete 6-step onboarding flow:
1. Personal Information
2. KYC Verification (Aadhaar + PAN)
3. Address Details
4. Employment Information
5. Bank Account Details
6. Loan Selection

### External API for Fintechs

RESTful API endpoint for fintech partners to programmatically create loan applications:

```bash
POST /api/external/applications
Headers: X-API-Key: your-api-key
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **ORM**: Drizzle ORM
- **Database**: Turso (SQLite)
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or bun
- Turso account (for database)

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/HarjjotSinghh/1fi-assignment-lms.git
cd 1fi-assignment-lms
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your Turso credentials:

```bash
cp .env.example .env
```

```env
TURSO_CONNECTION_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Create Turso database** (if not already created)

```bash
turso db create lms-database
turso db show lms-database --url
turso db tokens create lms-database
```

5. **Push database schema**

```bash
npx drizzle-kit push
```

6. **Start development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                               │
├─────────────────────────────────────────────────────────────┤
│ id, email, name, role, createdAt, updatedAt                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       CUSTOMERS                             │
├─────────────────────────────────────────────────────────────┤
│ id, firstName, lastName, email, phone, dateOfBirth          │
│ aadhaarNumber, aadhaarVerified, panNumber, panVerified      │
│ kycStatus, address, employment, bank details                │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────────┐   ┌───────────────┐
│ LOAN_PRODUCTS │   │ LOAN_APPLICATIONS │   │  COLLATERALS  │
├───────────────┤   ├───────────────────┤   ├───────────────┤
│ name, rates   │   │ amount, tenure    │   │ fundName, NAV │
│ tenure, LTV   │◄──│ status, source    │──►│ units, value  │
└───────────────┘   └───────────────────┘   │ pledgeStatus  │
                              │             └───────────────┘
                              ▼
                    ┌───────────────────┐
                    │      LOANS        │
                    ├───────────────────┤
                    │ principal, EMI    │
                    │ outstanding, LTV  │
                    │ status, maturity  │
                    └───────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌───────────────┐   ┌───────────────┐
            │ EMI_SCHEDULE  │   │   PAYMENTS    │
            ├───────────────┤   ├───────────────┤
            │ installmentNo │   │ amount, date  │
            │ dueDate, EMI  │   │ mode, status  │
            │ status        │   └───────────────┘
            └───────────────┘

### System & Compliance

┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  AUDIT_LOGS   │   │ NOTIFICATIONS │   │   APPROVALS   │
└───────────────┘   └───────────────┘   └───────────────┘
        ▲                   ▲                   ▲
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                  ┌───────────────────┐
                  │       USERS       │
                  └───────────────────┘
                            │
                  ┌─────────┴─────────┐
                  ▼                   ▼
          ┌───────────────┐   ┌──────────────────┐
          │  KYC_VERIF.   │   │   DIGILOCKER     │
          └───────────────┘   └──────────────────┘
```

## 🔌 API Reference

### External Applications API

**Endpoint**: `POST /api/external/applications`

**Authentication**: API Key in `X-API-Key` header

**Request Body**:

```json
{
  "customer": {
    "firstName": "Harjot",
    "lastName": "Rana",
    "email": "me@harjot.co",
    "phone": "9876543210",
    "dateOfBirth": "1990-01-15",
    "aadhaarNumber": "123456789012",
    "panNumber": "ABCDE1234F"
  },
  "loan": {
    "productId": "uuid-of-product",
    "requestedAmount": 500000,
    "tenure": 12
  },
  "externalReference": "YOUR-REF-123"
}
```

**Response**:

```json
{
  "success": true,
  "applicationId": "uuid",
  "applicationNumber": "APP-1234567890-ABCDEF",
  "status": "SUBMITTED",
  "message": "Loan application created successfully"
}
```

### Internal APIs

- `GET /api/products` - List all loan products
- `POST /api/products` - Create new loan product
- `GET /api/applications` - List all applications
- `POST /api/applications` - Create new application (manual)

## 🎨 Design System

- **Colors**: Emerald primary, Amber accent (no blue/purple)
- **Typography**: Space Grotesk (headings), Inter (body), JetBrains Mono (code)
- **Style**: Sharp corners, minimal shadows, clean and futuristic
- **Micro-interactions**: Hover effects, press scales, stagger animations

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Dashboard layout group
│   │   ├── dashboard/        # Main dashboard
│   │   ├── products/         # Loan Products module
│   │   ├── applications/     # Applications module
│   │   ├── loans/            # Active Loans module
│   │   ├── collateral/       # Collateral Management
│   │   ├── customers/        # Customer Management
│   │   ├── analytics/        # Reports & Analytics
│   │   ├── approvals/        # Approval Workflows
│   │   ├── activity/         # Audit Logs
│   │   ├── notifications/    # System Notifications
│   │   ├── playbook/         # System Guidelines
│   │   └── onboarding/       # Customer Onboarding
│   ├── api/
│   │   ├── admin/            # Admin operations
│   │   ├── products/         # Products API
│   │   ├── applications/     # Applications API
│   │   ├── kyc/              # KYC & DigiLocker API
│   │   ├── audit-logs/       # Audit Logging API
│   │   └── external/         # External Fintech API
│   └── layout.tsx            # Root layout with fonts
├── components/
│   ├── layout/               # Layout components (sidebar)
│   └── ui/                   # shadcn/ui components
├── db/
│   ├── index.ts              # Database connection
│   └── schema.ts             # Drizzle schema
└── lib/
    └── utils.ts              # Utility functions
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

### Manual

```bash
npm run build
npm start
```

## 📄 License

MIT

---

**Built for 1Fi SDE Assignment** - A LAMF Loan Management System Demo
