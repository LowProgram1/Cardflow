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
| **Auth** | Auto-logout (inactivity) | After 5 minutes of no mouse/keyboard/scroll/touch activity (configurable via `SESSION_LIFETIME` in .env), the user is logged out and redirected to login with an “inactivity” message. When the tab was in the background, logout runs on returning to the tab. Applies to both admin and user. |
| **Roles** | Admin vs User | Backend: `auth.isAdmin` and `role`; middleware `admin` protects `/users` and `/expenses`. Sidebar shows Users & Expenses only when `auth.isAdmin` is true. |
| **Dashboard** | View summary | Role-dependent: admin sees full metrics and lists; user sees only their expense logs and payment history. |
| **Profile** | Update profile | Edit name and password (Settings → Profile). Email is displayed but **not editable**. |
| **Users** | List / Create / Edit / Delete | **Admin only.** User CRUD; sidebar and routes restricted for non-admin. |
| **Cards** | List / Create / Edit / Delete | **Admin:** Full CRUD and card grid. **User:** View-only; no card tiles; only “Transactions & statements” (list of cards with View transactions and Statement links). |
| **Expenses** | List / Create / Edit / Delete | **Admin only.** Expense CRUD; toggle paid month for installments. Non-admin cannot access sidebar link or routes (403). |
| **Expenses** | Toggle paid month (installment) | Record or remove payment for a specific installment month (admin only). |
| **Settings** | Card types / Expense types / Payment terms | **Admin only.** CRUD for card types, expense types, and payment terms. |
| **Settings** | Profile | All roles. Name and password editable; email read-only. |
| **Settings** | Favicon / Logo | **Admin only.** Upload a .ico file (Settings → Profile) to set the browser tab icon and sidebar logo. One file used for both. |
| **UI (responsive)** | Desktop navigation | Vertical sidebar (≥768px): logo, Profile (avatar + name) pinned, nav links (Dashboard, Users, Cards, Expenses, Settings), Logout at bottom. Main content has margin-left; bottom bar hidden. |
| **UI (responsive)** | Mobile navigation | Fixed bottom bar (<768px): Dashboard, Users, Cards, Expenses (role-filtered); label above icon; safe-area padding. Top header: Profile, Settings, Logout. Sidebar hidden on mobile. Main content padding-bottom so bottom nav does not overlap. |
| **UI (responsive)** | Dashboard actions | “Manage Cards” and “Log Expense” show icon-only on mobile (text hidden); full label on desktop. Touch-friendly padding on mobile. |
| **Security** | Headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Content-Security-Policy; Strict-Transport-Security over HTTPS. |
| **Security** | Login | Throttled (5 attempts per minute per IP). Post-login redirect validated (same-origin or relative) to prevent open redirects. |
| **Password** | Strong rules | Min 10 characters, upper and lower case, number, symbol (profile and user create/edit). Optional strength indicator and confirmation match hint in UI. |

---

## 4. Modules & Technology Stack

### 4.1 Backend

- **Framework**: Laravel 12 (PHP 8.2+).
- **Key packages**: `inertiajs/inertia-laravel`, `laravel/framework`, `laravel/tinker`.
- **Architecture**: Controllers → Services → Repositories; Form Requests for validation; Eloquent models.

| Layer | Path | Purpose |
|-------|------|---------|
| Controllers | `app/Http/Controllers/` | Dashboard, User, Card, Expense, Profile, Settings, CardType, ExpenseType, PaymentTerm. Role checks in Dashboard (scoped data), Expense, Card, User (admin middleware or inline). |
| Middleware | `app/Http/Middleware/` | `HandleInertiaRequests` (shares `auth.user`, `auth.isAdmin`, `auth.idleTimeoutMinutes`, `favicon_url`); `EnsureUserIsAdmin` (alias `admin`) for users/expenses routes; `SecurityHeaders` for response headers. |
| Services | `app/Services/` | CardService, ExpenseService, UserService, DashboardService (supports optional `userId` for scoped dashboard data). |
| Repositories | `app/Repositories/Eloquent/` | CardRepository, ExpenseRepository, UserRepository (methods accept optional `userId` for filtering). |
| Models | `app/Models/` | User (role), Card, CardType, Expense, ExpenseType, PaymentTerm. |
| Requests | `app/Http/Requests/` | Validation for store/update (Card, User, Expense, etc.). |
| Helpers | `app/Helpers/` | CurrencyHelper, StatementPeriodHelper. |

### 4.2 Frontend

- **Stack**: React 18, Inertia.js (React), Vite 7.
- **Key packages**: `@inertiajs/react`, `@inertiajs/progress`, `react`, `react-dom`, `react-data-table-component`, Tailwind CSS 4.

| Area | Path | Purpose |
|------|------|---------|
| Pages | `resources/js/Pages/` | Dashboard, Users/Index, Cards/Index, Expenses/Index, Settings/Index. Dashboard uses `props.isAdmin`; Cards uses `viewOnly` for user role; Settings shows only Profile for non-admin; Expenses shows/hides user column and user dropdown by `isAdmin`. |
| Layout | `resources/js/components/layout/` | **Desktop (≥768px):** Vertical Sidebar (logo, pinned Profile, nav, Settings, Logout at bottom); main content with margin-left; bottom nav hidden. **Mobile (<768px):** Sidebar hidden; fixed bottom nav (Dashboard, Users, Cards, Expenses) with label above icon; top header with Profile, Settings, Logout. AppLayout and Sidebar; nav items filtered by `props.auth.isAdmin`. |
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

See **MIGRATION.md** for the full ordered list and descriptions of each migration.

---

## 6. Quick Start

1. Copy `.env.example` to `.env`; set `APP_URL`, `DB_*`; run `php artisan key:generate`.
2. `composer install`, `npm install`, `npm run build`.
3. Run migrations: `php artisan migrate` (see MIGRATION.md).
4. (Optional) Set `SESSION_LIFETIME=5` in `.env` for idle timeout in minutes (default 5; auto-logout after inactivity for both admin and user).
5. (Optional) For production over HTTPS: set `SESSION_SECURE_COOKIE=true` and `SESSION_SAME_SITE=lax` in `.env`.
6. (Optional) Seed: `php artisan db:seed` or specific seeders (CardTypeSeeder, ExpenseTypeSeeder, PaymentTermSeeder).
7. Create an admin user (or ensure existing user has `role = 'admin'` in `users` table; null/missing role is treated as admin).
8. Serve: `php artisan serve`; for dev with Vite: `npm run dev`.

---

## 7. License

MIT (or as specified in the project).
