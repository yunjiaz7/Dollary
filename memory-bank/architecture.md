# architecture.md — Dollary

## Backend

**Framework:** Spring Boot 3.5.0, Java 17
**Base package:** `com.billingbook`

### Package Structure (`backend/src/main/java/com/billingbook/`)

```
com.billingbook
├── config/
│   ├── SecurityConfig.java        — Spring Security: CORS, CSRF disabled, session-based auth, permit /api/health + /api/auth/**
│   ├── DataInitializer.java       — Seeds 9 system categories on first startup (ApplicationRunner)
│   └── GlobalExceptionHandler.java — @ControllerAdvice: converts ResponseStatusException to {"error": "message"}
├── controller/
│   ├── HealthController.java      — GET /api/health returns "ok"
│   ├── AuthController.java        — POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
│   ├── CategoryController.java    — GET /api/categories, POST /api/categories
│   ├── TransactionController.java — GET/POST/PUT/DELETE /api/transactions + POST /api/transactions/import
│   └── SummaryController.java    — GET /api/summary, GET /api/summary/categories
│   ├── TransactionResponse.java     — Record: id, amount, date, merchantName, categoryName, categoryId, note, isIncome, isManual
│   ├── SummaryResponse.java        — Record: totalIncome, totalExpense, balance
│   ├── CategorySummaryResponse.java — Record: categoryName, totalAmount
│   ├── TransactionCreateRequest.java — Record: amount, date, categoryId, note, isIncome
│   └── TransactionUpdateRequest.java — Record: amount, categoryId, note, isIncome (all nullable)
├── model/
│   ├── Category.java              — JPA entity: id (UUID), name, is_system; table: categories
│   └── Transaction.java           — JPA entity: id, amount, date, merchant_name, category (FK), note, is_income, is_manual, category_modified_by_user, source_hash (unique), created_at, updated_at; table: transactions
├── repository/
│   ├── CategoryRepository.java    — Spring Data JPA; existsBySystemTrue(), existsByName()
│   └── TransactionRepository.java — Spring Data JPA; existsBySourceHash(), findByDateBetweenOrderByDateDesc(), sumIncomeByDateBetween(), sumExpenseByDateBetween(), sumExpenseByCategoryBetween()
└── service/
    ├── CsvImportService.java      — Parses BOA CSV, auto-categorizes by keyword, de-duplicates by source_hash, skips pending
    ├── TransactionService.java   — CRUD for transactions: list by month, create (manual), update (sets categoryModifiedByUser), delete (manual only)
    └── SummaryService.java       — Monthly totals (income/expense/balance), category spending breakdown
```

### Authentication
- **Single-user mode:** Credentials from env vars `APP_USERNAME`/`APP_PASSWORD` (defaults: admin/admin123)
- **Session:** In-memory, HttpOnly cookie (`JSESSIONID`), 7-day timeout
- **CORS:** Allows `http://localhost:5173` for all `/api/**` endpoints with credentials
- **Protected endpoints:** All `/api/**` except `/api/health` and `/api/auth/**` require authentication
- **Login flow:** Validates credentials, creates `UsernamePasswordAuthenticationToken`, stores in `HttpSession`
- **Logout:** Invalidates session and clears `SecurityContext`
- **`/me` endpoint:** Returns 200 `{authenticated: true}` or 401 `{error: "未登录"}`

### Configuration (`application.properties`)
- PostgreSQL connection: `localhost:5433/billingbook`
- Hibernate ddl-auto: `update` (auto-creates tables)
- Session timeout: 7 days
- SQL logging: enabled
- Auth credentials: `app.username=${APP_USERNAME:admin}`, `app.password=${APP_PASSWORD:admin123}`

### Data Model
- **Category**: `id` (UUID), `name` (VARCHAR), `is_system` (BOOLEAN) — 9 system presets seeded by DataInitializer
- **Transaction**: `id` (UUID), `amount` (NUMERIC 12,2), `transaction_date` (DATE), `merchant_name` (VARCHAR), `category_id` (FK → categories), `note` (VARCHAR nullable), `is_income` (BOOLEAN), `is_manual` (BOOLEAN), `category_modified_by_user` (BOOLEAN), `source_hash` (VARCHAR unique nullable), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ)
- System categories (seeded): 餐饮, 购物, 交通, 娱乐, 账单/水电, 医疗, 旅行, 收入, 其他

### Database
- **Engine:** PostgreSQL 16 via Docker Compose
- **Container:** `billingbook-db` on port **5433** (local PG already uses 5432)
- **Credentials:** db=billingbook, user=billingbook, password=billingbook
- **Volume:** `pgdata` for persistence

## Frontend

**Framework:** React 18 + Vite
**Port:** 5173

### Package Dependencies
- `tailwindcss` + `@tailwindcss/vite` — Styling (Mobile First)
- `axios` — HTTP client (baseURL: `http://localhost:8080`, withCredentials: true)
- `recharts` — Charts (Step 17+)
- `react-router-dom` — Routing

### Directory Structure (`frontend/src/`)
```
src/
├── utils/
│   └── api.js                     — Axios instance (baseURL + withCredentials)
├── pages/
│   ├── LoginPage.jsx              — Login form with warm editorial styling
│   └── HomePage.jsx               — Main page: header, transaction list, add/import buttons, CSV import, modals
├── components/
│   ├── TransactionList.jsx        — Month selector + scrollable transaction cards (Brutalist style)
│   ├── TransactionModal.jsx       — Add/edit modal: amount, category dropdown, note, income/expense toggle, delete
│   ├── SummaryCards.jsx           — 3-col grid: income, expense, balance cards with color coding
│   └── Charts.jsx                 — Pie/Bar chart tabs via Recharts, category spending breakdown, empty state
├── hooks/
│   ├── useTransactions.js         — Fetches transactions by month, month navigation, refresh
│   ├── useCategories.js           — Fetches category list
│   └── useSummary.js              — Fetches summary + category summary by month, auto-refreshes on month change
├── App.jsx                        — React Router: / → HomePage, /login → LoginPage, auth guard
├── index.css                      — Tailwind CSS + IBM Plex Mono font import
└── main.jsx                       — Entry point
```

### Routing & Auth
- **`/login`** — LoginPage (redirects to `/` if already authenticated)
- **`/`** — HomePage (redirects to `/login` if not authenticated)
- **Auth check:** On mount, calls `GET /api/auth/me` to determine auth state
- **Logout:** Calls `POST /api/auth/logout`, clears state, redirects to `/login`

### Design System (Brutalist / Tactile Tool UI)
- **Background:** Sandy warm gray `#E8E4DC`
- **Text:** Deep charcoal `#2C2C2C`
- **Typography:** IBM Plex Mono (monospace) for headings, labels, buttons
- **Accent blue:** `#4A90D9` (primary actions, category tags)
- **Accent orange:** `#E8651A` (manual tags, warnings)
- **Income green:** `#2D8B4E`
- **Expense red:** `#C4533A`
- **Borders:** 2px solid `#2C2C2C` on all cards and buttons
- **Cards:** `#FDFAF4` background, rounded-xl, 2px border + bottom shadow for depth
- **Buttons:** 3D tactile — thick border + `box-shadow: 0 3px 0 0 #2C2C2C`, active press compresses shadow
- **Input backgrounds:** `#FDFAF4`
- **No gradients, no glassmorphism, no soft shadows**

## Infrastructure

```
docker-compose.yml
├── db (postgres:16)
│   ├── port 5433:5432
│   └── volume: pgdata
```

## What's Working
- Backend compiles and starts on port 8080
- `GET /api/health` returns `"ok"` (no auth required)
- PostgreSQL container connects successfully (HikariPool confirmed)
- Frontend builds and serves on port 5173
- Tailwind CSS integrated
- **Auth system fully functional:**
  - `POST /api/auth/login` — validates credentials, creates HttpOnly session cookie
  - `POST /api/auth/logout` — invalidates session
  - `GET /api/auth/me` — returns 200/401 based on session state
  - CORS configured for `localhost:5173` with credentials
  - Frontend login page with routing and auth guard
  - Protected endpoints redirect to login when not authenticated
- **Category API functional:**
  - `GET /api/categories` — returns all categories (system + custom)
  - `POST /api/categories` — creates custom category (name required, no duplicates, is_system=false)
- **Transaction CRUD functional:**
  - `GET /api/transactions?year=&month=` — returns transactions for that month, sorted by date descending
  - `POST /api/transactions` — creates manual transaction (amount must be positive, merchantName defaults to "手动添加")
  - `PUT /api/transactions/{id}` — edits amount/category/note/isIncome; sets categoryModifiedByUser=true when category changes
  - `DELETE /api/transactions/{id}` — deletes manual transactions only; returns 403 for CSV-imported records
  - Amount validation: rejects zero or negative amounts with 400 + `{"error": "金额必须为正数"}`
  - GlobalExceptionHandler ensures all ResponseStatusExceptions return `{"error": "message"}` format
- **CSV import functional:**
  - `POST /api/transactions/import` — accepts multipart CSV, parses BOA format via Apache Commons CSV
  - Auto-categorization by Payee keyword matching (8 category mappings + fallback to 其他)
  - De-duplication via source_hash (Reference Number); pending transactions (empty Posted Date) skipped
  - Amount normalized to positive; is_income flag set based on sign
  - Returns `{imported, skippedDuplicate, skippedPending}` counts
  - Validates file not empty and has .csv extension
- **Data model created:**
  - `categories` table with 9 system presets seeded on first startup
  - `transactions` table with FK to categories, unique constraint on source_hash
  - DataInitializer ensures no duplicate seeding on restart
- **Frontend transaction list and CRUD functional:**
  - TransactionList component with month selector (prev/next arrows), date-desc order
  - Each card shows: merchant name, date, category tag, note, colored amount (green=income, red=expense)
  - Manual transactions marked with orange "MANUAL" tag
  - TransactionModal for add/edit: amount, date, category dropdown, note, income/expense toggle
  - Delete button (manual only) with confirmation dialog
  - "+ Add Transaction" and "Import CSV" action buttons in HomePage
  - All styled with Brutalist/Tactile UI (thick borders, 3D buttons, monospace typography)
- **Summary and charts functional:**
  - `GET /api/summary?year=&month=` — returns totalIncome, totalExpense, balance (2 decimal precision)
  - `GET /api/summary/categories?year=&month=` — returns expenses by category sorted by amount desc
  - SummaryCards component: 3-col grid showing income (green), expense (red), balance (green/red)
  - Charts component: tabbed pie/bar chart using Recharts, with category colors and tooltips
  - useSummary hook: fetches both APIs in parallel, refreshes on month change
  - Empty state text shown when no expense data (no empty charts)
  - Summary refreshes on add/edit/delete/import actions
