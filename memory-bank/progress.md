# progress.md — Dollary

## Phase 1: 项目初始化

| Step | Description | Status |
|------|-------------|--------|
| Step 1 | 初始化后端项目 (Spring Boot + packages + health endpoint) | Done |
| Step 2 | 本地数据库环境 (Docker Compose PostgreSQL on port 5433) | Done |
| Step 3 | 初始化前端项目 (Vite + React + Tailwind + Axios + Recharts) | Done |

## Phase 2: 登录系统

| Step | Description | Status |
|------|-------------|--------|
| Step 4 | 后端登录接口 (POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me) | Done |
| Step 5 | 前端登录页 (LoginPage, React Router, auth guard, warm editorial styling) | Done |

## Phase 3: 数据模型

| Step | Description | Status |
|------|-------------|--------|
| Step 6 | 创建数据库表 | Done |
| Step 7 | 预设分类数据 | Done |

## Phase 4: 分类接口

| Step | Description | Status |
|------|-------------|--------|
| Step 8 | 分类 API | Done |

## Phase 5: CSV 导入

| Step | Description | Status |
|------|-------------|--------|
| Step 9 | 后端 CSV 解析与导入 (CsvImportService + TransactionController + Apache Commons CSV) | Done |
| Step 10 | 前端 CSV 上传页面 (HomePage import button, file picker, loading/results/error states) | Done |

## Phase 6: 交易记录

| Step | Description | Status |
|------|-------------|--------|
| Step 11 | 交易列表 API (GET /api/transactions?year=&month=, date-desc order, TransactionResponse DTO) | Done |
| Step 12 | 手动添加 / 编辑 / 删除交易 API (POST/PUT/DELETE, amount validation, CSV delete restriction, category_modified_by_user flag) | Done |
| Step 13 | 前端交易列表页 (TransactionList component, month selector, income/expense color, manual tag, Brutalist UI) | Done |
| Step 14 | 前端编辑 / 添加 / 删除交互 (TransactionModal component, category dropdown, income/expense toggle, delete with confirm) | Done |

## Phase 7: 统计与图表

| Step | Description | Status |
|------|-------------|--------|
| Step 15 | 收支总览 API (GET /api/summary — totalIncome, totalExpense, balance) | Done |
| Step 16 | 分类统计 API (GET /api/summary/categories — expenses by category, sorted desc) | Done |
| Step 17 | 前端收支总览与图表 (SummaryCards 3-col grid, Charts with pie/bar tabs via Recharts, useSummary hook, empty states) | Done |

## Phase 8: 收尾

| Step | Description | Status |
|------|-------------|--------|
| Step 18 | 响应式检查与样式完善 | Not started |
| Step 19 | 部署后端到 Railway | Not started |
| Step 20 | 部署前端到 Vercel | Not started |
| Step 21 | 端到端功能验收 | Not started |
