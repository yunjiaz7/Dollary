# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This project is in the **planning/design phase** — detailed specs exist in `memory-bank/` but source code has not been created yet. Refer to these files before implementing anything:

- `memory-bank/design-document.md` — Features, user journeys, data model, acceptance criteria
- `memory-bank/tech-stack.md` — Technology choices and rationale
- `memory-bank/implementation-plan.md` — 21-step implementation roadmap (8 phases)
- `memory-bank/progress.md` — Track implementation progress here

## Tech Stack

**Backend:** Java Spring Boot 3, Spring Data JPA + Hibernate, Spring Security (session-based), PostgreSQL, Apache Commons CSV
**Frontend:** React 18, Vite, Tailwind CSS (mobile-first), Recharts, Axios
**Infrastructure:** Docker Compose (local PostgreSQL), Railway (backend), Vercel (frontend)
**Testing:** JUnit 5 + Mockito (backend), Postman (API)

## Commands

### Backend (once created)
```bash
docker compose up -d          # Start local PostgreSQL
./mvnw spring-boot:run        # Run Spring Boot dev server (localhost:8080)
./mvnw test                   # Run all tests
./mvnw test -Dtest=ClassName  # Run a single test class
```

### Frontend (once created)
```bash
npm install
npm run dev    # Vite dev server (localhost:5173)
npm run build
```

## Architecture

### Backend Structure (planned: `backend/src/main/java/com/...`)
- `/controller` — REST endpoints
- `/service` — Business logic (auto-categorization, CSV parsing, de-duplication)
- `/repository` — Spring Data JPA repositories
- `/model` — `Transaction`, `Category` entities
- `/config` — Spring Security, CORS, `DataInitializer` (seeds system categories)

### Frontend Structure (planned: `frontend/src/`)
- `/pages` — `LoginPage`, `HomePage`
- `/components` — `TransactionList`, charts, `CsvImporter`, summary cards
- `/hooks` — Custom hooks wrapping Axios API calls
- `/utils` — Axios instance with `withCredentials: true`

### Key Design Decisions
- **Single-user auth:** Credentials stored in environment variables, not a user table. Session via HttpOnly cookie (7-day expiry).
- **CSV import:** BOA format only. De-duplication via `source_hash` (SHA-256 of Reference Number).
- **Auto-categorization:** Keyword matching on `merchant_name` (Payee field) at import time. Only re-runs if user hasn't manually set the category.
- **Delete restriction:** Only manually-added transactions can be deleted; CSV-imported ones cannot.
- **Data model core fields:** `Transaction(id, amount, date, merchant_name, category_id, note, is_income, is_manual, category_modified_by_user, source_hash)` + `Category(id, name, is_system)`

### API Surface (all require session auth except `/api/auth/**` and `/api/health`)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/login` | POST | Login |
| `/api/auth/logout` | POST | Logout |
| `/api/transactions` | GET | List (supports `?year=&month=` filter) |
| `/api/transactions` | POST | Add manual transaction |
| `/api/transactions/{id}` | PUT | Edit transaction |
| `/api/transactions/{id}` | DELETE | Delete (manual only) |
| `/api/transactions/import` | POST | Upload BOA CSV |
| `/api/summary` | GET | Monthly income/expense/balance |
| `/api/summary/categories` | GET | Spending by category |
| `/api/categories` | GET | List categories |
| `/api/categories` | POST | Create custom category |

## Important Rules

- Before writing any code, you must fully read memory-bank/@architecture.md
- Before writing any code, you must fully read memory-bank/@design-document.md
- After completing any major feature or milestone, you must update memory-bank/@architecture.md
