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

### Backend Structure (planned: `backend/src/main/java/com/billingbook/...`)
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
- **CSV import:** BOA format only. De-duplication via `source_hash` (raw Reference Number, no hashing).
- **Auto-categorization:** Keyword matching on `merchant_name` (Payee field) at import time. Only re-runs if user hasn't manually set the category.
- **Delete restriction:** Only manually-added transactions can be deleted; CSV-imported ones cannot.
- **Manual transactions:** User explicitly toggles income/expense via `is_income` field; amount is always positive.
- **Error format:** All API errors return `{"error": "message"}`.
- **No pagination:** Monthly queries return all results without pagination.
- **Data model core fields:** `Transaction(id, amount, date, merchant_name, category_id, note, is_income, is_manual, category_modified_by_user, source_hash)` + `Category(id, name, is_system)`

### API Surface (all require session auth except `/api/auth/**` and `/api/health`)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/login` | POST | Login |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/me` | GET | Check login status (200=logged in, 401=not) |
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

## Frontend Development Rules

- Before writing any frontend code, you must load and apply the /frontend-design skill and /minimalist-ui skill
- Design direction: warm editorial minimalism — inspired by high-quality print magazines
- Background: cream/off-white (#F5F0E8 or similar warm white), never pure white or dark
- Text: deep charcoal (not pure black), clear typographic hierarchy
- Cards: thin borders, no heavy shadows, clean and structured
- Typography: pair a serif or semi-serif display font for headings with a clean sans-serif for body text
- Accent colors: muted blue and warm orange as highlights only, used sparingly
- Spacing: generous, airy — never cramped or dense
- Motion: subtle only — light hover effects, no flashy animations
- Avoid: purple gradients, cold blues, Inter/Roboto fonts, glassmorphism, pure white backgrounds, generic AI aesthetics
- This is a personal finance app — the design should feel trustworthy, calm, and approachable

## Workflow Rules

- At the start of every new task, you must fully read ALL files in memory-bank/:
  - design-document.md
  - tech-stack.md
  - implementation-plan.md
  - progress.md
  - architecture.md
- Execute all steps within a phase before stopping
- Do not start the next phase until the user explicitly confirms the current phase is validated
- After the user confirms validation:
  - Update memory-bank/progress.md with what was done
  - Update memory-bank/architecture.md to reflect any new or changed files
  - Append validation steps for the phase to VALIDATION.md (do not overwrite existing content)
  - Then wait for the user's next instruction — do not proceed automatically
- If you hit any blocker during execution, stop immediately and ask the user
- After completing a major feature or milestone, remind the user to make a git commit
