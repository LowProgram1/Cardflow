# Cardflow — Web Application Documentation

## 1. Overview

**Cardflow** is a web application for managing credit/debit cards and expenses. It supports full-payment and installment expenses, tracks monthly amortization and payments per installment month, and provides a dashboard with totals and summaries. The app uses a role-based user model (e.g. admin) and centralizes settings for card types, expense types, and payment terms.

---

## 2. Description & Purpose

- **Cards**: Create and manage cards with name, bank, type, credit limit, statement day, due day, and optional last four digits. Cards can be activated/deactivated and assigned a color for the UI.
- **Expenses**: Record expenses or payments linked to a card. Expenses can be **full payment** (single amount, mark as paid once) or **installment** (term in months, monthly amortization, per-month payment tracking with optional overpayment applied to the next month).
- **Installment payment rules**: For installments, months must be paid in order (1, then 2, then 3…). The amount paid for a month can be greater than or equal to the amount due; excess is applied to the next month’s bill. Each month’s payment is recorded with a specific amount (stored in `paid_month_amounts`).
- **Dashboard**: Shows aggregate figures such as total paid portion (full + installment, using actual paid amounts for installments), and other summary data derived from cards and expenses.
- **Settings**: Single settings area for profile, card types, expense types, and payment terms (CRUD). User management (CRUD) is available for admin.

---

## 3. Functions & Features

| Area | Function | Description |
|------|----------|-------------|
| **Auth** | Login / Logout | Session-based authentication; logout invalidates session and redirects to dashboard. |
| **Dashboard** | View summary | Totals and summaries (e.g. paid portion, installment vs full, by card/user). |
| **Profile** | Update profile | Edit name, email, password (via Settings → Profile). |
| **Users** | List / Create / Edit / Delete | User management (index, store, update, destroy). |
| **Cards** | List / Create / Edit / Delete | Card CRUD; link to user, bank, card type, limit, statement_day, due_day, color, last_four, is_active. |
| **Expenses** | List / Create / Edit / Delete | Expense CRUD; link to card, user, expense type, amount, date, type (expense/payment), payment_type (full/installment), payment_term, monthly_amortization. |
| **Expenses** | Toggle paid month (installment) | Record or remove payment for a specific installment month. Pay: modal shows amount due, user enters amount paid (≥ due); overpayment reduces next month. Unpay: confirm and remove that month’s payment. Months must be paid in sequence. |
| **Settings** | Card types | CRUD for card types (e.g. Visa, Mastercard). |
| **Settings** | Expense types | CRUD for expense types (e.g. Groceries, Utilities). |
| **Settings** | Payment terms | CRUD for payment terms (e.g. 3, 6, 9, 12 months). |

---

## 4. Modules & Technology Stack

### 4.1 Backend

- **Framework**: Laravel 12 (PHP 8.2+).
- **Key packages**:
  - `inertiajs/inertia-laravel` — Adapter for Inertia.js (server-driven SPA).
  - `laravel/framework`, `laravel/tinker`.
- **Architecture**: Controllers → Services → Repositories; Form Requests for validation; Eloquent models.

| Layer | Path | Purpose |
|-------|------|---------|
| Controllers | `app/Http/Controllers/` | HTTP handling: Dashboard, User, Card, CardType, Expense, ExpenseType, PaymentTerm, Profile, Settings. |
| Services | `app/Services/` | Business logic: CardService, ExpenseService, UserService, DashboardService (totals, installment aggregation). |
| Repositories | `app/Repositories/Eloquent/` | Data access: CardRepository, ExpenseRepository, UserRepository (e.g. getInstallmentExpenses, getTotalPaidPortion using `paid_month_amounts` when present). |
| Models | `app/Models/` | User, Card, CardType, Expense, ExpenseType, PaymentTerm. |
| Requests | `app/Http/Requests/` | Validation for store/update (Card, User, Expense, ExpenseType, PaymentTerm, CardType, Profile). |
| Helpers | `app/Helpers/` | e.g. CurrencyHelper for formatting. |

### 4.2 Frontend

- **Stack**: React 18, Inertia.js (React), Vite 7.
- **Key packages**:
  - `@inertiajs/react`, `@inertiajs/progress`
  - `react`, `react-dom`
  - `react-data-table-component` — Data tables (e.g. expenses, cards, users).
  - `axios` — HTTP (used by Inertia under the hood where applicable).
- **Styling**: Tailwind CSS 4 (`@tailwindcss/vite`).
- **Build**: Vite with `@vitejs/plugin-react` / `laravel-vite-plugin`.

| Area | Path | Purpose |
|------|------|---------|
| Pages | `resources/js/Pages/` | Dashboard, Users/Index, Cards/Index, Expenses/Index, Settings/Index, CardTypes/Index. |
| Layout | `resources/js/components/layout/` | AppLayout, Sidebar (navigation). |
| UI | `resources/js/components/ui/` | Modal, ConfirmModal, SuccessModal, DataTable, FormField, FormValidationSummary, PasswordInput, Toast, FlashOverlay. |

### 4.3 Routing (Backend)

- **web.php**: All app routes (no API prefix).
- **Key routes**: `GET /` (dashboard), `/logout`, `/profile` → settings, `/settings`, `PATCH /profile`, `resource users|cards|expenses`, card-types/expense-types/payment-terms (index redirect to settings + store/update/destroy), `POST expenses/{expense}/paid-month` (toggle paid month).
- **Fallback**: Redirect to dashboard.

---

## 5. Database

### 5.1 Tables Overview

| Table | Description |
|-------|-------------|
| **users** | id, role, name, email, email_verified_at, password, remember_token, timestamps. |
| **password_reset_tokens** | email (PK), token, created_at. |
| **sessions** | id (PK), user_id, ip_address, user_agent, payload, last_activity. |
| **cards** | id, user_id, bank_name, card_type_id, name, last_four, limit, statement_day, due_day, is_active, color, timestamps. |
| **card_types** | id, name (unique), timestamps. |
| **expenses** | id, card_id, expense_type_id, user_id, description, amount, type (expense|payment), payment_type (full|installment), payment_term_id, monthly_amortization, paid_months (JSON), paid_month_amounts (JSON), last_paid_at, transaction_date, category, metadata, timestamps. |
| **expense_types** | id, name (unique), timestamps. |
| **payment_terms** | id, months (unique, e.g. 3,6,9,12), timestamps. |
| **cache** | Laravel cache table. |
| **jobs** | Laravel queue jobs table. |

### 5.2 Main Columns (Expenses)

- **type**: `expense` | `payment`.
- **payment_type**: `full` | `installment`.
- **payment_term_id**: References `payment_terms` (e.g. 12 months); used for installments.
- **monthly_amortization**: Required for installments; amount due per month before overpayment carry.
- **paid_months**: JSON array of month numbers (1-based) that are paid; kept in sync with `paid_month_amounts`.
- **paid_month_amounts**: JSON object `{ "1": "1000.00", "2": "1200.00" }` for actual amount paid per month; overpayments reduce the next month’s required amount in logic.
- **last_paid_at**: Set when a payment (full or an installment month) is marked paid; cleared when no paid months remain.

### 5.3 Relationships (Eloquent)

- **User**: hasMany Card; hasMany Expense.
- **Card**: belongsTo User, CardType; hasMany Expense.
- **Expense**: belongsTo Card, User, ExpenseType, PaymentTerm.
- **CardType / ExpenseType / PaymentTerm**: referenced by Card and Expense.

### 5.4 Migrations (Order)

1. `0001_01_01_000000_create_users_table` (users, password_reset_tokens, sessions)
2. `0001_01_01_000001_create_cache_table`
3. `0001_01_01_000002_create_jobs_table`
4. `2026_03_10_000010_add_role_to_users_table`
5. `2026_03_10_000020_create_cards_table`
6. `2026_03_10_000025_create_card_types_table`
7. `2026_03_10_000027_alter_cards_table_add_bank_and_statement`
8. `2026_03_10_000030_create_expenses_table`
9. `2026_03_10_000040_create_expense_types_table`
10. `2026_03_10_000041_create_payment_terms_table`
11. `2026_03_10_000042_alter_expenses_add_type_and_payment_fields`
12. `2026_03_10_000050_add_color_to_cards_table`
13. `2026_03_10_000060_add_paid_months_to_expenses`
14. `2026_03_11_000001_add_last_paid_at_to_expenses`
15. `2026_03_11_000002_add_paid_month_amounts_to_expenses`

---

## 6. Quick Start

- Copy `.env.example` to `.env`, configure DB and app URL, run `php artisan key:generate`.
- Run `composer install`, `npm install`, `npm run build`.
- Run migrations: `php artisan migrate`.
- (Optional) Seed: `php artisan db:seed`.
- Serve: `php artisan serve` (e.g. port 8001); for dev with Vite: `npm run dev` (or project’s dev script).

---

## 7. License

MIT (or as specified in the project).
