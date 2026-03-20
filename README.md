# Cardflow — Web Application Documentation

## 1. Overview

**Cardflow** is a web application for managing credit/debit cards and expenses. It supports full-payment and installment expenses, tracks monthly amortization and payments per installment month, and provides a dashboard with totals and summaries. The app uses **role-based access**: **admin** users have full access (users, expenses, cards CRUD, all settings); **user/client** users see only their own data, limited sidebar (Dashboard, Cards, Settings), profile-only settings, and cards as transactions/statements only.

---

## 2. Description & Purpose

- **Cards**: Create and manage cards with name, bank, type, credit limit, statement day, due day, and optional last four digits. Cards can be activated/deactivated and assigned a color. **Admin** can create/edit/delete; **user** can only view transactions and statement of account (no card list tiles).
- **Expenses**: Record expenses or payments linked to a card. Expenses can be **full payment** (single amount, mark as paid once) or **installment** (term in months, monthly amortization, per-month payment tracking with optional overpayment applied to the next month). **Admin** can manage all expenses; **user** cannot access the Expenses module (sidebar and routes are restricted).
- **Installment payment rules**: For installments, months must be paid in order (1, then 2, then 3…). The amount paid for a month can be greater than or equal to the amount due; excess is applied to the next month’s bill. Each month’s payment is recorded with a specific amount (stored in `paid_month_amounts`).
- **Dashboard**: **Admin** sees overall outstanding balance, users count, active cards, expenses (installment & full) logs, payment history, and cards list. **User** sees only their own expense logs (installment & full), payment history, and remaining-to-pay; no outstanding balance card, no active cards metric, no cards section, no “Log Expense” / “Manage expenses” links.
- **Settings**: **Admin** has full settings: Profile, Card types, Expense types, Payment terms. **User** sees only Profile (name and password; email is read-only and cannot be edited).
- **Users**: User management (list, create, edit, delete) is **admin-only**. The Users link and routes are hidden and protected for non-admin roles.

---

## 3. Functions & Features

| Area | Function | Description |
|------|----------|-------------|
| **Auth** | Login / Logout | Session-based authentication; shared `auth.user` and `auth.isAdmin` for frontend; logout invalidates session and redirects to login. |
| **Auth** | Session/CSRF expiry (419) | When the session or CSRF token has expired, the app redirects to the login page instead of showing the "419 | PAGE EXPIRED" error. Handled server-side in `bootstrap/app.php` (TokenMismatchException and HttpException 419 → redirect to login) and client-side in `resources/js/bootstrap.js` (fetch wrapper redirects on 419 for XHR requests). |
| **Auth** | Auto-logout (inactivity) | After 5 minutes of no mouse/keyboard/scroll/touch activity (configurable via `SESSION_LIFETIME` in .env), the user is logged out and redirected to login with an “inactivity” message. When the tab was in the background, logout runs on returning to the tab. Applies to both admin and user. |
| **Roles** | Admin vs User | Backend: `auth.isAdmin` and `role`; middleware `admin` protects `/users` and `/expenses`. Sidebar shows Users & Expenses only when `auth.isAdmin` is true. |
| **Dashboard** | View summary | Role-dependent: admin sees full metrics and lists; user sees only their expense logs and payment history. |
| **Dashboard** | Monthly outstanding with advance credit | Per-card and overall monthly outstanding can be negative for advance payments; credit is consumed in the next statement cycle to move values back toward zero. |
| **Profile** | Update profile | Edit name and password (Settings → Profile). Email is displayed but **not editable**. |
| **Users** | List / Create / Edit / Delete | **Admin only.** User CRUD; sidebar and routes restricted for non-admin. |
| **Cards** | List / Create / Edit / Delete | **Admin:** Full CRUD and card grid. **User:** View-only; no card tiles; only “Transactions & statements” (list of cards with View transactions and Statement links). |
| **Cards** | Monthly drill-down modal behavior | From card tile or view icon: opens monthly obligations modal; `Back to cards` exits cleanly (no blank intermediate modal state). |
| **Expenses** | List / Create / Edit / Delete | **Admin only.** Expense CRUD; toggle paid month for installments. Non-admin cannot access sidebar link or routes (403). |
| **Expenses** | Toggle paid month (installment) | Record or remove payment for a specific installment month (admin only). |
| **Expenses** | Exact installment month payment | Installment month payment amount is fixed to the computed due amount (exact match required). UI disables manual edit for standard month payments and shows success/error validation messages. |
| **Settings** | Card types / Expense types / Payment terms | **Admin only.** CRUD for card types, expense types, and payment terms. |
| **Settings** | Profile | All roles. Name and password editable; email read-only. |
| **Settings** | Favicon / Logo | **Admin only.** Upload a .ico file (Settings → Profile) to set the browser tab icon and sidebar logo. One file used for both. |
| **Salary** | PDF export preview and filters | Full-time and part-time PDF exports open in a new tab (`stream`) for review first. Full-time supports optional class filter (`Class ID` shown in PDF metadata). Part-time supports optional student filter (`Student Name`). |
| **UI (responsive)** | Desktop navigation | Vertical sidebar (≥768px): logo, Profile (avatar + name) pinned, nav links (Dashboard, Users, Cards, Expenses, Settings), Logout at bottom. Main content has margin-left; bottom bar hidden. |
| **UI (responsive)** | Mobile navigation | Fixed bottom bar (<768px): Dashboard, Users, Cards, Expenses (role-filtered); label below icon; safe-area padding. Top header: Profile, Settings, Logout. Sidebar hidden on mobile. Main content padding-bottom so bottom nav does not overlap. |
| **UI (responsive)** | Dashboard actions | “Manage Cards” and “Log Expense” show icon-only on mobile (text hidden); full label on desktop. Touch-friendly padding on mobile. |
| **Security** | Headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Content-Security-Policy, COOP/CORP; Strict-Transport-Security over HTTPS. See [docs/SECURITY.md](docs/SECURITY.md). |
| **Security** | Login / Auth | Throttled (auth and auth-sensitive limiters). Post-login redirect validated (same-origin or relative) to prevent open redirects. Host header validation when `ALLOWED_HOSTS` is set. |
| **Password** | Strong rules | Min 12 characters, upper and lower case, number, symbol (profile and user create/edit). Optional strength indicator and confirmation match hint in UI. |

---

## 4. Modules & Technology Stack

### 4.1 Backend

- **Framework**: Laravel 12 (PHP 8.2+).
- **Key packages**: `inertiajs/inertia-laravel`, `laravel/framework`, `laravel/tinker`.
- **Architecture**: Controllers → Services → Repositories; Form Requests for validation; Eloquent models.

| Layer | Path | Purpose |
|-------|------|---------|
| Controllers | `app/Http/Controllers/` | Dashboard, User, Card, Expense, Profile, Settings, CardType, ExpenseType, PaymentTerm. Role checks in Dashboard (scoped data), Expense, Card, User (admin middleware or inline). |
| Middleware | `app/Http/Middleware/` | `ValidateHost` (allowed hosts); `HandleInertiaRequests` (shares `auth.user`, `auth.isAdmin`, `auth.idleTimeoutMinutes`, `favicon_url`); `EnsureUserIsAdmin` (alias `admin`); `SecurityHeaders` for response headers; `CheckFeature` (alias `feature`) for feature-gated routes. |
| Exceptions | `bootstrap/app.php` | Custom renderable for `TokenMismatchException` and `HttpException` 419 → redirect to login (avoids showing "419 | PAGE EXPIRED"). |
| Services | `app/Services/` | CardService, ExpenseService, UserService, DashboardService (supports optional `userId` for scoped dashboard data). |
| Repositories | `app/Repositories/Eloquent/` | CardRepository, ExpenseRepository, UserRepository (methods accept optional `userId` for filtering). |
| Models | `app/Models/` | User (role), Card, CardType, Expense, ExpenseType, PaymentTerm. |
| Requests | `app/Http/Requests/` | Validation for store/update (Card, User, Expense, etc.). |
| Helpers | `app/Helpers/` | CurrencyHelper, StatementPeriodHelper. |

**Statement period correctness**
- `StatementPeriodHelper::periodFor()` clamps `statement_day` to each month’s actual max day to avoid short-month overflow (e.g. day 31 in April). This keeps month sequencing/pay-order logic correct in Cards and Dashboard.

### 4.2 Frontend

- **Stack**: React 18, Inertia.js (React), Vite 7.
- **Key packages**: `@inertiajs/react`, `@inertiajs/progress`, `react`, `react-dom`, `react-data-table-component`, Tailwind CSS 4.

| Area | Path | Purpose |
|------|------|---------|
| Pages | `resources/js/Pages/` | Dashboard, Users/Index, Cards/Index, Expenses/Index, Settings/Index. Dashboard uses `props.isAdmin`; Cards uses `viewOnly` for user role; Settings shows only Profile for non-admin; Expenses shows/hides user column and user dropdown by `isAdmin`. |
| Layout | `resources/js/components/layout/` | **Desktop (≥768px):** Vertical Sidebar (logo, pinned Profile, nav, Settings, Logout at bottom); main content with margin-left; bottom nav hidden. **Mobile (<768px):** Sidebar hidden; fixed bottom nav (Dashboard, Users, Cards, Expenses) with label below icon; top header with Profile, Settings, Logout. AppLayout and Sidebar; nav items filtered by `props.auth.isAdmin`. |
| UI | `resources/js/components/ui/` | Modal, ConfirmModal, DataTable, FormField, FormValidationSummary, PasswordInput, PasswordStrengthIndicator, PasswordConfirmationHint, FlashBanner, etc. |

### 4.3 Routing & Middleware

- **web.php**: Guest routes (login); auth routes (dashboard, settings, profile, cards, expenses, users, etc.).
- **Admin-only routes**: `Route::resource('users', ...)->middleware('admin')`; `Route::resource('expenses', ...)->middleware('admin')`; `POST expenses/{expense}/paid-month` and `POST /settings/favicon` use `middleware('admin')`. Non-admin receives **403 Forbidden**. The admin middleware treats null/missing `role` as admin so existing admin accounts are not incorrectly blocked.
- **Shared data**: `auth.user` (name, email, role), `auth.isAdmin` (boolean). Sidebar reads `usePage().props.auth` to show/hide Users and Expenses.

---

## 5. Database

### 5.1 Tables Overview

| Table | Description |
|-------|-------------|
| **users** | id, **role** (admin|user, default admin), name, email, email_verified_at, password, remember_token, timestamps. |
| **password_reset_tokens** | email (PK), token, created_at. |
| **sessions** | id (PK), user_id, ip_address, user_agent, payload, last_activity. |
| **cards** | id, user_id, bank_name, card_type_id, name, last_four, limit, statement_day, due_day, is_active, color, timestamps. |
| **card_types** | id, name (unique), timestamps. |
| **expenses** | id, card_id, expense_type_id, user_id, description, amount, type (expense|payment), payment_type (full|installment), payment_term_id, monthly_amortization, paid_months (JSON), paid_month_amounts (JSON), last_paid_at, transaction_date, category, metadata, timestamps. |
| **expense_types** | id, name (unique), timestamps. |
| **payment_terms** | id, months (unique), timestamps. |
| **cache** / **jobs** | Laravel cache and queue tables. |

### 5.2 Main Columns (Expenses)

- **type**: `expense` | `payment`.
- **payment_type**: `full` | `installment`.
- **payment_term_id**, **monthly_amortization**: For installments.
- **paid_months**: JSON array of paid month numbers (1-based).
- **paid_month_amounts**: JSON object of amount paid per month; used for overpayment carry.
- **last_paid_at**: Updated when a payment or installment month is marked paid.

### 5.3 Relationships

- **User**: hasMany Card, hasMany Expense.
- **Card**: belongsTo User, CardType; hasMany Expense.
- **Expense**: belongsTo Card, User, ExpenseType, PaymentTerm.

### 5.4 Migrations (Order)

See **[docs/MIGRATION.md](docs/MIGRATION.md)** for the full ordered list and descriptions of each migration.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/MIGRATION.md](docs/MIGRATION.md) | Database migrations: order, how to run, optional seeders. |
| [docs/SECURITY.md](docs/SECURITY.md) | Web security: headers, rate limiting, session, production checklist. |
| [docs/CUSTOMIZE_EMAILS.md](docs/CUSTOMIZE_EMAILS.md) | Customizing email templates and verification flow. |
| [docs/DEPLOY_HOSTINGER.md](docs/DEPLOY_HOSTINGER.md) | Deploy to Hostinger using GitHub (webhook, VPS + Actions, or manual). |

---

## 6. Quick Start

1. Copy `.env.example` to `.env`; set `APP_URL`, `DB_*`; run `php artisan key:generate`.
2. `composer install`, `npm install`, `npm run build`.
3. Run migrations: `php artisan migrate` (see [docs/MIGRATION.md](docs/MIGRATION.md)).
4. (Optional) Set `SESSION_LIFETIME=5` in `.env` for idle timeout in minutes (default 5; auto-logout after inactivity for both admin and user).
5. (Optional) For production over HTTPS: set `SESSION_SECURE_COOKIE=true` and `SESSION_SAME_SITE=lax` in `.env`.
6. (Optional) Seed: `php artisan db:seed` or specific seeders (CardTypeSeeder, ExpenseTypeSeeder, PaymentTermSeeder).
7. Create an admin user (or ensure existing user has `role = 'admin'` in `users` table; null/missing role is treated as admin).
8. Serve: `php artisan serve`; for dev with Vite: `npm run dev`.

### 6.1 Development: live reload (no need to stop server or run build)

To get **live updates** when you change frontend code (JS/React/CSS), use the Vite dev server so you don’t have to run `npm run build` or restart the PHP server on every change.

**Option A – one command (recommended)**  
From the project root, run:
```bash
npm run start
```
This starts both the Vite dev server and `php artisan serve`. Edit React/JS/CSS and see changes in the browser immediately (hot module replacement). You do **not** need to stop the server or run `npm run build` for frontend changes.

**Option B – two terminals**  
- Terminal 1: `npm run dev` (Vite with HMR).  
- Terminal 2: `php artisan serve`.  
Open the app at the URL shown by `php artisan serve` (e.g. `http://127.0.0.1:8000`). Frontend changes will reload automatically.

**Backend (PHP) changes**  
For changes to PHP, Blade, or `.env`, a **browser refresh** is usually enough. You only need to restart `php artisan serve` if you change config, routes, or run `php artisan config:clear` / `route:clear`. You do **not** need to run `npm run build` during development.

**If you see a blank page and the tab title is "Laravel"**  
- The app needs built frontend assets or a running Vite dev server. Either run `npm run build` once (then refresh), or run `npm run start` (or `npm run dev` + `php artisan serve`) so Vite serves the app. The browser tab title will show "CardFlow" when the app loads; if you still see "Laravel", set `APP_NAME=CardFlow` in your `.env`.

---

## 7. Repository

Source code: [https://github.com/LowProgram1/Web-Applications.git](https://github.com/LowProgram1/Web-Applications.git)

---

## 8. License

MIT (or as specified in the project).
