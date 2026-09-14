# Sheikh Trader

> A full-stack Point-of-Sale & shop accounting dashboard built to replace the handwritten ledger (khata) for a retail electronics business. Tracks sales, inventory, dues, expenses, and multi-account finances — all from a single, responsive interface.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Database Schema](#database-schema)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [License](#license)

---

## Tech Stack

| Layer          | Technology                                                    |
| -------------- | ------------------------------------------------------------- |
| Framework      | [Next.js 16](https://nextjs.org) (App Router, React 19)      |
| Language       | TypeScript 5                                                  |
| Database       | PostgreSQL — raw queries via `pg`, migrations via `node-pg-migrate` |
| Auth           | Custom JWT sessions (`jose` + `bcryptjs`), HTTP-only cookies  |
| Data Fetching  | TanStack React Query 5 (SSR-hydrated, 60 s stale time)       |
| Tables         | TanStack Table 9 + `@dnd-kit` drag-and-drop row reordering   |
| Charts         | Recharts 3                                                    |
| UI Kit         | shadcn/ui components, Tailwind CSS v4, Lucide icons           |
| Validation     | Zod 4                                                         |
| Theme          | Dark / Light mode via `next-themes` + CSS custom properties   |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  React 19  ·  TanStack Query  ·  shadcn/ui  ·  Recharts     │
└──────────────┬───────────────────────────────────────────────┘
               │  HTTP (cookies)
┌──────────────▼───────────────────────────────────────────────┐
│  Next.js 16 Edge Middleware (proxy.ts)                       │
│  → JWT verification · route protection · security headers    │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│  API Route Handlers  (/app/api/**)                           │
│  Auth · Products · Sales · Customers · Stock · Expenses      │
│  Due Collections · Accounts · Reports (daily/monthly/yearly) │
└──────────────┬───────────────────────────────────────────────┘
               │  pg pool
┌──────────────▼───────────────────────────────────────────────┐
│  PostgreSQL                                                  │
│  users · products · customers · accounts · sales             │
│  sale_items · stock_ins · expenses · due_collections         │
└──────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

- **Route Groups** — The `(shop)` route group shares a sidebar/header layout across all protected pages without affecting URL paths.
- **SSR + React Query Hydration** — Initial data is fetched on the server and hydrated to the client query cache, giving instant page loads with zero loading spinners on first paint.
- **Centralized DB Pool** — A single `pg.Pool` instance in `app/lib/dbConnection.ts` is reused across all API handlers.
- **Middleware-First Auth** — The `proxy.ts` middleware validates JWT tokens and redirects unauthenticated users _before_ any route handler executes. No auth logic is duplicated across endpoints.

---

## Database Schema

```
users
  id              SERIAL PK
  username        VARCHAR UNIQUE NOT NULL
  password_hash   TEXT NOT NULL
  token_version   INT DEFAULT 0
  created_at      TIMESTAMPTZ

products
  id              SERIAL PK
  name            VARCHAR NOT NULL
  category        ENUM ('AC','AC_PARTS','TV','OTHER')
  unit            VARCHAR
  current_stock   INT DEFAULT 0
  buy_price       NUMERIC
  sell_price      NUMERIC
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

customers
  id              SERIAL PK
  name            VARCHAR NOT NULL
  phone           VARCHAR
  address         TEXT
  created_at      TIMESTAMPTZ

accounts                                     ← pre-seeded: Cash, DBBL, BRAC, Bkash
  id              SERIAL PK
  name            VARCHAR NOT NULL
  type            ENUM ('cash','bank','mobile')
  balance         NUMERIC DEFAULT 0
  created_at      TIMESTAMPTZ

sales
  id              SERIAL PK
  sale_date       DATE
  customer_id     FK → customers
  total_amount    NUMERIC
  paid_amount     NUMERIC
  due_amount      NUMERIC
  profit          NUMERIC
  account_id      FK → accounts
  note            TEXT
  created_at      TIMESTAMPTZ

sale_items
  id              SERIAL PK
  sale_id         FK → sales
  product_id      FK → products
  qty             INT
  buy_price       NUMERIC
  sell_price      NUMERIC

stock_ins
  id              SERIAL PK
  product_id      FK → products
  qty             INT
  buy_price       NUMERIC
  purchase_date   DATE
  note            TEXT
  created_at      TIMESTAMPTZ

expenses
  id              SERIAL PK
  expense_date    DATE
  category        VARCHAR
  amount          NUMERIC
  account_id      FK → accounts
  note            TEXT
  created_at      TIMESTAMPTZ

due_collections
  id              SERIAL PK
  customer_id     FK → customers
  sale_id         FK → sales
  amount          NUMERIC
  account_id      FK → accounts
  collection_date DATE
  created_at      TIMESTAMPTZ
```

---

## Features

### ✅ Completed

| Module            | Details                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| **Authentication** | JWT-based login/logout, HTTP-only cookie sessions, password change, CLI user provisioning, token revocation via `token_version` |
| **Dashboard**      | Live metric cards (today's sales, expenses, profit, dues), interactive area charts with daily/monthly/yearly views |
| **Point of Sale**  | Multi-item invoice creation, automatic profit calculation, customer selection/creation, payment account selection |
| **Products**       | Full CRUD with category filtering (AC, AC Parts, TV, Other), stock tracking, buy/sell price management |
| **Inventory**      | Stock-in recording with purchase price, automatic `current_stock` updates on sales and stock-ins   |
| **Expenses**       | Categorized expense logging tied to financial accounts, date-based tracking                        |
| **Due Management** | Track outstanding customer dues per sale, collect partial/full payments against specific invoices   |
| **Accounts**       | Multi-account balance overview (Cash, DBBL, BRAC, Bkash), automatic balance updates on all transactions |
| **Reports**        | Daily, monthly, yearly, and custom date-range financial reports                                    |
| **Data Tables**    | Server-side pagination, column visibility toggling, drag-and-drop row reordering                  |
| **Theming**        | Dark / Light mode toggle persisted via `next-themes`                                              |
| **Settings**       | Per-user default rows-per-page preference stored in `localStorage`                                |
| **Security**       | Middleware-enforced route protection, security headers, no public signup endpoint                  |

### 🛣️ Planned / Recommended

| Feature                      | Why It Matters                                                       |
| ---------------------------- | -------------------------------------------------------------------- |
| **Role-Based Access (RBAC)** | Separate cashier vs. admin views — cashiers shouldn't see profit margins or full reports |
| **Invoice PDF / Print**      | Physical POS needs printable receipts and downloadable invoices       |
| **CSV / Excel Export**       | Export sales, expenses, and reports for offline bookkeeping or tax filing |
| **Inventory Valuation**      | Dashboard card showing total trapped capital (`Σ current_stock × buy_price`) |
| **Returns & Adjustments**    | Handle product returns, damaged goods, and manual stock corrections  |
| **Customer Ledger**          | Per-customer transaction history with running balance                 |
| **Audit Log**                | Track who changed what and when — critical for multi-user setups     |
| **Backup & Restore**         | Scheduled `pg_dump` with one-click restore from the dashboard        |
| **SMS / Notification**       | Due-date reminders to customers via SMS                              |
| **PWA Support**              | Installable on tablets for counter-top use                           |

---

## Getting Started

### Prerequisites

| Requirement  | Version |
| ------------ | ------- |
| Node.js      | ≥ 20    |
| npm          | ≥ 10    |
| PostgreSQL   | ≥ 15    |

### 1. Clone & Install

```bash
git clone https://github.com/MasudRiam/sheikh-trader.git
cd sheikh-trader
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
JWT_SECRET="replace-with-a-random-32-plus-character-secret"
```

> **Generating a secure JWT secret:**
>
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
> ```

### 3. Run Database Migrations

```bash
npm run migrate:up
```

This creates all required tables (`users`, `products`, `customers`, `accounts`, `sales`, etc.) and seeds the default financial accounts.

### 4. Create Your First User

There is no public registration — users are provisioned via CLI:

```bash
npm run user:create
```

Follow the interactive prompts to set a username and password.

### 5. Start the Dev Server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** → you'll be redirected to the login page.

### 6. Build for Production

```bash
npm run build
npm run start
```

---

## Environment Variables

| Variable       | Required | Description                                                    |
| -------------- | -------- | -------------------------------------------------------------- |
| `DATABASE_URL` | ✅        | PostgreSQL connection string                                   |
| `JWT_SECRET`   | ✅        | Secret key for signing JWT tokens (min 32 characters)          |

---

## API Reference

All endpoints (except auth) require a valid session cookie.

### Auth

| Method | Endpoint                | Description               |
| ------ | ----------------------- | ------------------------- |
| POST   | `/api/auth/login`       | Authenticate & set cookie |
| POST   | `/api/auth/logout`      | Clear session cookie      |
| GET    | `/api/auth/me`          | Get current user profile  |
| POST   | `/api/auth/change-password` | Update password       |

### Products

| Method | Endpoint              | Description                          |
| ------ | --------------------- | ------------------------------------ |
| GET    | `/api/products`       | List products (paginated or full)    |
| POST   | `/api/products`       | Create a new product                 |
| GET    | `/api/products/[id]`  | Get product by ID                    |
| PUT    | `/api/products/[id]`  | Update product                       |
| DELETE | `/api/products/[id]`  | Delete product                       |

### Sales & Transactions

| Method | Endpoint              | Description                          |
| ------ | --------------------- | ------------------------------------ |
| GET    | `/api/sales`          | List all sales (paginated)           |
| POST   | `/api/sales`          | Create new sale / invoice            |
| GET    | `/api/customers`      | List customers                       |
| GET    | `/api/stock-ins`      | List stock-in entries                |
| POST   | `/api/stock-ins`      | Record a stock-in                    |
| GET    | `/api/expenses`       | List expenses (paginated)            |
| POST   | `/api/expenses`       | Log a new expense                    |
| GET    | `/api/due`            | List outstanding dues                |
| POST   | `/api/due`            | Collect a due payment                |
| GET    | `/api/accounts`       | Get account balances                 |

### Reports

| Method | Endpoint                | Description                |
| ------ | ----------------------- | -------------------------- |
| GET    | `/api/reports/daily`    | Today's summary            |
| GET    | `/api/reports/monthly`  | Current month summary      |
| GET    | `/api/reports/yearly`   | Current year summary       |
| GET    | `/api/reports/range`    | Custom date-range report   |

---

## Project Structure

```
sheikh-trader/
├── app/
│   ├── (shop)/                  # Route group — shared sidebar layout
│   │   ├── dashboard/           # Live metrics + charts
│   │   ├── sales/               # Sales list + new invoice page
│   │   ├── products/            # Product catalog CRUD
│   │   ├── due/                 # Due tracking & collection
│   │   ├── expenses/            # Expense logging
│   │   ├── accounts/            # Multi-account balances
│   │   ├── reports/             # Financial reports
│   │   ├── settings/            # User preferences
│   │   └── account/             # Password change
│   ├── api/                     # REST API route handlers
│   │   ├── auth/                # login · logout · me · change-password
│   │   ├── products/            # CRUD + [id]
│   │   ├── sales/               # Create & list
│   │   ├── customers/           # Customer lookup
│   │   ├── stock-ins/           # Inventory inbound
│   │   ├── expenses/            # Expense CRUD
│   │   ├── due/                 # Due collection
│   │   ├── accounts/            # Balance queries
│   │   └── reports/             # daily · monthly · yearly · range
│   ├── lib/                     # Server-side utilities
│   │   ├── dbConnection.ts      # Centralized pg pool
│   │   ├── queries/             # SQL query abstractions
│   │   └── auth.ts              # JWT helpers
│   ├── login/                   # Public login page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Redirect → /dashboard
│   └── globals.css              # Tailwind v4 theme config
├── components/
│   ├── ui/                      # shadcn/ui primitives
│   ├── app-sidebar.tsx          # Navigation sidebar
│   ├── data-table.tsx           # Advanced TanStack Table wrapper
│   ├── dashboard-live.tsx       # Real-time stat cards
│   ├── chart-area-interactive.tsx  # Recharts dashboard widget
│   └── ...                      # Nav, header, shell components
├── hooks/
│   └── use-mobile.ts            # Responsive breakpoint hook
├── lib/
│   ├── get-query-client.ts      # Shared React Query client (SSR)
│   ├── settings.ts              # Client-side user preferences
│   └── utils.ts                 # Utility helpers
├── types/                       # TypeScript interfaces
│   ├── products.ts
│   └── shop.ts
├── migrations/                  # node-pg-migrate SQL migrations
├── scripts/
│   └── create-user.mjs          # CLI user provisioning
├── proxy.ts                     # Next.js middleware (auth + headers)
├── .env.example                 # Environment template
└── package.json
```

---

## Scripts Reference

| Command                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Start dev server with hot reload                |
| `npm run build`        | Production build                                |
| `npm run start`        | Serve production build                          |
| `npm run lint`         | Run ESLint                                      |
| `npm run migrate:up`   | Apply pending database migrations               |
| `npm run migrate:down` | Roll back the last migration                    |
| `npm run migrate:create` | Scaffold a new migration file                 |
| `npm run user:create`  | Interactively create a new user via CLI         |

---

## License

Private — not licensed for redistribution.
