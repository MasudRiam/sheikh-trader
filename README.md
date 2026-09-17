# Sheikh Trader

> A full-stack Point-of-Sale & shop accounting dashboard built to replace the handwritten ledger (khata) for a retail electronics business. Tracks sales, inventory, dues, expenses, and multi-account finances — all from a single, responsive interface.

**Live App:** https://sheikh-trader.vercel.app/

---

## Try the Live Demo (For HR / Reviewers — No Setup Needed)

Open the live app and log in with the demo account. The demo shop comes pre-loaded with sample products, sales, dues, and expenses so every page shows real data.

**URL:** https://sheikh-trader.vercel.app/login

| Field    | Value      |
| -------- | ---------- |
| Username | `Demo123`  |
| Password | `12345678` |

### What to click (2-minute tour)

1. **Dashboard** (`/dashboard`) — today's sales, profit, dues, and interactive daily/monthly/yearly charts.
2. **Sales / POS** (`/sales`) — invoice list with customer + account info; create a new invoice with multiple items. Profit is calculated automatically.
3. **Products** (`/products`) — AC, AC Parts, TV catalog with live stock, buy/sell price.
4. **Due (Baki)** (`/due`) — outstanding dues per invoice; collect a partial or full payment against a sale.
5. **Expenses (Khoroch)** (`/expenses`) — categorized costs deducted from the selected account.
6. **Accounts** (`/accounts`) — Cash, DBBL, BRAC, Bkash balances that update automatically on every sale, expense, and due collection.
7. **Reports** (`/reports`) — daily, monthly, yearly, and custom date-range summaries (total sell, cash received, due, profit, khoroch, net).

### Demo vs. real data

- Every login gets its **own isolated shop**. Anything you create as `Demo123` is visible **only** to `Demo123` — it never leaks into other accounts.
- The demo shop is pre-seeded with: 6 products, 3 customers, 3 sales, 3 expenses, 1 due collection, and realistic account balances (Cash ৳53,000, Bkash ৳28,800, DBBL ৳5,000).
- Feel free to create, edit, and delete — the data model enforces per-user ownership on every table.

---

## Table of Contents

- [Live Demo](#try-the-live-demo-for-hr--reviewers--no-setup-needed)
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
| Hosting        | Vercel (app) + Neon (PostgreSQL)                              |

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
               │  pg pool (per-user scoped: WHERE user_id = $1)
┌──────────────▼───────────────────────────────────────────────┐
│  PostgreSQL (Neon)                                           │
│  users · products · customers · accounts · sales             │
│  sale_items · stock_ins · expenses · due_collections         │
└──────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

- **Per-user shop isolation** — every business table carries `user_id` (FK → `users`, `ON DELETE CASCADE`). All queries are scoped with `WHERE user_id = $1`, and cross-references (sale → product/customer/account) are ownership-checked inside transactions. Demo and real shops can never see each other's data.
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
  email           VARCHAR UNIQUE
  name            VARCHAR
  token_version   INT DEFAULT 0
  created_at      TIMESTAMPTZ

products                                    ← scoped per user (user_id)
  id              SERIAL PK
  user_id         INT FK → users (NOT NULL, CASCADE)
  name            VARCHAR NOT NULL
  category        ENUM ('AC','AC_PARTS','TV','OTHER')
  unit            VARCHAR
  current_stock   INT DEFAULT 0
  buy_price       NUMERIC
  sell_price      NUMERIC
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

customers                                   ← scoped per user
  id              SERIAL PK
  user_id         INT FK → users (NOT NULL, CASCADE)
  name            VARCHAR NOT NULL
  phone           VARCHAR
  address         TEXT
  created_at      TIMESTAMPTZ

accounts                                    ← scoped per user, UNIQUE (user_id, name)
                                            ← seeded per user: Cash, DBBL, BRAC, Bkash
  id              SERIAL PK
  user_id         INT FK → users (NOT NULL, CASCADE)
  name            VARCHAR NOT NULL
  type            ENUM ('cash','bank','mobile')
  balance         NUMERIC DEFAULT 0
  created_at      TIMESTAMPTZ

sales                                       ← scoped per user
  id              SERIAL PK
  user_id         INT FK → users (NOT NULL, CASCADE)
  sale_date       DATE
  customer_id     FK → customers
  total_amount    NUMERIC
  paid_amount     NUMERIC
  due_amount      NUMERIC
  profit          NUMERIC
  account_id      FK → accounts
  note            TEXT
  created_at      TIMESTAMPTZ

sale_items (child of sales — ownership via parent sale)
  id              SERIAL PK
  sale_id         FK → sales (CASCADE)
  product_id      FK → products
  qty             INT
  buy_price       NUMERIC
  sell_price      NUMERIC

stock_ins                                   ← scoped per user
  id              SERIAL PK
  user_id         INT FK → users (NOT NULL, CASCADE)
  product_id      FK → products
  qty             INT
  buy_price       NUMERIC
  purchase_date   DATE
  note            TEXT
  created_at      TIMESTAMPTZ

expenses                                    ← scoped per user
  id              SERIAL PK
  user_id         INT FK → users (NOT NULL, CASCADE)
  expense_date    DATE
  category        VARCHAR
  amount          NUMERIC
  account_id      FK → accounts
  note            TEXT
  created_at      TIMESTAMPTZ

due_collections                             ← scoped per user
  id              SERIAL PK
  user_id         INT FK → users (NOT NULL, CASCADE)
  customer_id     FK → customers
  sale_id         FK → sales
  amount          NUMERIC
  account_id      FK → accounts
  collection_date DATE
  created_at      TIMESTAMPTZ
```

---

## Features

### Completed

| Module            | Details                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| **Live Demo**      | Public Vercel deployment with isolated `Demo123` shop pre-seeded for HR review                  |
| **Per-User Isolation** | `user_id` on all business tables; every query ownership-scoped; demo data never leaks        |
| **Authentication** | JWT-based login/logout, HTTP-only cookie sessions, password change, UI-based registration with OTP verification, token revocation via `token_version` |
| **Dashboard**      | Live metric cards (today's sales, expenses, profit, dues), interactive area charts with daily/monthly/yearly views |
| **Point of Sale**  | Multi-item invoice creation, automatic profit calculation, customer selection/creation, payment account selection |
| **Products**       | Full CRUD with category filtering (AC, AC Parts, TV, Other), stock tracking, buy/sell price management |
| **Inventory**      | Stock-in recording with purchase price, automatic `current_stock` updates on sales and stock-ins   |
| **Expenses**       | Categorized expense logging tied to financial accounts, date-based tracking                        |
| **Due Management** | Track outstanding customer dues per sale, collect partial/full payments against specific invoices   |
| **Accounts**       | Multi-account balance overview (Cash, DBBL, BRAC, Bkash) per user, automatic balance updates on all transactions |
| **Reports**        | Daily, monthly, yearly, and custom date-range financial reports                                    |
| **Data Tables**    | Server-side pagination, column visibility toggling, drag-and-drop row reordering                  |
| **Theming**        | Dark / Light mode toggle persisted via `next-themes`                                              |
| **Settings**       | Per-user default rows-per-page preference stored in `localStorage`                                |
| **Security**       | Middleware-enforced route protection, ownership checks in every transaction, security headers, brute-force login throttling |

### Planned / Recommended

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

This creates all required tables (`users`, `products`, `customers`, `accounts`, `sales`, etc.), adds per-user isolation (`user_id`), and seeds the default financial accounts (Cash, DBBL, BRAC, Bkash) for each user.

### 4. Create Your First User

You can create an account using the web UI:

1. Start the dev server (see below).
2. Go to **http://localhost:3000/register**.
3. Fill out the registration form.
4. Check the terminal/server logs or your database (`pending_registrations` table) for the 6-digit OTP code.
5. Enter the code on the verification page to complete signup. Default accounts are created automatically.

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

The production deployment lives at **https://sheikh-trader.vercel.app/** (Vercel + Neon Postgres).

---

## Environment Variables

| Variable       | Required | Description                                                    |
| -------------- | -------- | -------------------------------------------------------------- |
| `DATABASE_URL` | ✅        | PostgreSQL connection string                                   |
| `JWT_SECRET`   | ✅        | Secret key for signing JWT tokens (min 32 characters)          |

---

## API Reference

All endpoints (except auth) require a valid session cookie and are scoped to the logged-in user.

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
| GET    | `/api/products`       | List own products (paginated or full)|
| POST   | `/api/products`       | Create a new product                 |
| GET    | `/api/products/[id]`  | Get own product by ID                |
| PUT    | `/api/products/[id]`  | Update own product                   |
| DELETE | `/api/products/[id]`  | Delete own product                   |

### Sales & Transactions

| Method | Endpoint              | Description                          |
| ------ | --------------------- | ------------------------------------ |
| GET    | `/api/sales`          | List own sales (paginated)           |
| POST   | `/api/sales`          | Create new sale / invoice            |
| GET    | `/api/customers`      | List own customers                   |
| GET    | `/api/stock-ins`      | List own stock-in entries            |
| POST   | `/api/stock-ins`      | Record a stock-in                    |
| GET    | `/api/expenses`       | List own expenses (paginated)        |
| POST   | `/api/expenses`       | Log a new expense                    |
| GET    | `/api/due`            | List own outstanding dues            |
| POST   | `/api/due`            | Collect a due payment                |
| GET    | `/api/accounts`       | Get own account balances             |

### Reports

| Method | Endpoint                | Description                |
| ------ | ----------------------- | -------------------------- |
| GET    | `/api/reports/daily`    | Today's summary (own data) |
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
│   ├── api/                     # REST API route handlers (user-scoped)
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
│   │   ├── queries/             # SQL query abstractions (user_id scoped)
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
│   └── 1789400000000_user-isolation.js  # per-user shop isolation
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

---

## License

Private — not licensed for redistribution.
