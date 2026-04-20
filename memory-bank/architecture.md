# architecture.md — Personal Finance Tracker

## Backend

**Framework:** Spring Boot 3.5.0, Java 17
**Base package:** `com.billingbook`

### Package Structure (`backend/src/main/java/com/billingbook/`)

```
com.billingbook
├── config/
│   └── SecurityConfig.java        — Spring Security: CORS, CSRF disabled, session-based auth, permit /api/health + /api/auth/**
├── controller/
│   ├── HealthController.java      — GET /api/health returns "ok"
│   └── AuthController.java        — POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
├── model/                         — (empty, Step 6)
├── repository/                    — (empty, Step 6)
└── service/                       — (empty, Step 9+)
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
│   └── HomePage.jsx               — Main page with header, sign out, empty state
├── components/                    — (empty, Step 10+)
├── hooks/                         — (empty, Step 13+)
├── App.jsx                        — React Router: / → HomePage, /login → LoginPage, auth guard
├── index.css                      — Tailwind CSS import
└── main.jsx                       — Entry point
```

### Routing & Auth
- **`/login`** — LoginPage (redirects to `/` if already authenticated)
- **`/`** — HomePage (redirects to `/login` if not authenticated)
- **Auth check:** On mount, calls `GET /api/auth/me` to determine auth state
- **Logout:** Calls `POST /api/auth/logout`, clears state, redirects to `/login`

### Design System
- **Background:** Cream/off-white `#F5F0E8`
- **Text:** Deep charcoal `#2C2C2C`
- **Headings:** Georgia serif
- **Body text:** System UI sans-serif
- **Accent:** Muted blue `#5B8CB0`
- **Borders:** `#E5DDD0`
- **Input backgrounds:** `#FDFBF7`
- **Cards:** White/60 with thin borders, no heavy shadows

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
