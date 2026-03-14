# Database Migrations

This document describes how to run and manage migrations for Cardflow, and lists all migrations in execution order.

---

## How to Run Migrations

### First-time setup (fresh database)

From the project root:

```bash
php artisan migrate
```

This runs all pending migrations in order and creates/updates tables.

### After pulling new migrations

Run only pending migrations (existing data is preserved):

```bash
php artisan migrate
```

### Resetting the database (destructive)

Drop all tables and re-run every migration from scratch (e.g. for a clean dev environment):

```bash
php artisan migrate:fresh
```

**Warning:** This deletes all data. Do not use on production.

### Rollback (undo last batch)

```bash
php artisan migrate:rollback
```

---

## Migration Order and Summary

Migrations run in filename order. Below is the full list used in Cardflow.

| # | Migration file | Description |
|---|----------------|-------------|
| 1 | `0001_01_01_000000_create_users_table` | Creates `users`, `password_reset_tokens`, and `sessions` tables. |
| 2 | `0001_01_01_000001_create_cache_table` | Creates Laravel cache table. |
| 3 | `0001_01_01_000002_create_jobs_table` | Creates Laravel queue jobs table. |
| 4 | `2026_03_10_000010_add_role_to_users_table` | Adds `role` column to `users`: string, length 20, default `'admin'`, indexed. Used for admin vs user/client access. |
| 5 | `2026_03_10_000020_create_cards_table` | Creates `cards` table: user_id, name, last_four, limit, is_active, timestamps; indexes on user_id and is_active. |
| 6 | `2026_03_10_000025_create_card_types_table` | Creates `card_types` (id, name unique). Required before cards reference card_type_id. |
| 7 | `2026_03_10_000027_alter_cards_table_add_bank_and_statement` | Adds to `cards`: `bank_name`, `card_type_id` (FK to card_types), `statement_day`, `due_day`. Removes `closing_day` if present. |
| 8 | `2026_03_10_000030_create_expenses_table` | Creates `expenses`: card_id, expense_type_id, user_id, description, amount, type, transaction_date, etc.; indexes on user_id and transaction_date. |
| 9 | `2026_03_10_000040_create_expense_types_table` | Creates `expense_types` (id, name unique). For expense form (e.g. Airlines, Hotel, Grocery). |
| 10 | `2026_03_10_000041_create_payment_terms_table` | Creates `payment_terms` (id, months unique). For installment options (e.g. 3, 6, 9, 12 months). |
| 11 | `2026_03_10_000042_alter_expenses_add_type_and_payment_fields` | Adds to `expenses`: `expense_type_id`, `payment_type` (full/installment), `payment_term_id`, `monthly_amortization`. |
| 12 | `2026_03_10_000050_add_color_to_cards_table` | Adds `color` to `cards` (e.g. blue, red, black for UI). |
| 13 | `2026_03_10_000060_add_paid_months_to_expenses` | Adds to `expenses`: `paid_months` (JSON array of paid month numbers) for installment tracking. |
| 14 | `2026_03_11_000001_add_last_paid_at_to_expenses` | Adds `last_paid_at` (timestamp) to `expenses`; set when a payment or installment month is marked paid. |
| 15 | `2026_03_11_000002_add_paid_month_amounts_to_expenses` | Adds `paid_month_amounts` (JSON) to `expenses` for actual amount paid per month; used for overpayment carry to next month. |
| 16 | `2026_03_12_000001_create_features_table` | Creates `features` (id, name unique, display_name). For feature flags (e.g. cards, expense_tracker, salary_monitoring). |
| 17 | `2026_03_12_000002_create_feature_user_table` | Creates pivot `feature_user` linking users to features. |
| 18 | `2026_03_13_150541_encrypt_sensitive_columns_on_cards_table` | Encrypts `name`, `last_four`, `bank_name` on `cards` (text columns; Laravel Crypt). Card `name` was later decrypted again (see migration 31). |
| 19 | `2026_03_13_151451_assign_cards_feature_to_existing_users` | Data migration: assigns the cards feature to existing users. |
| 20 | `2026_03_14_000001_create_salary_classes_table` | Creates `salary_classes`: user_id, class_name, duration (minutes). |
| 21 | `2026_03_14_000002_create_salary_rates_table` | Creates `salary_rates`: user_id, rate_date (or year), hourly_rate, urgent_rate. |
| 22 | `2026_03_14_000003_create_salary_payments_table` | Creates `salary_payments`: salary_class_id, salary_rate_id, schedule_duration, etc. |
| 23 | `2026_03_14_015634_add_employment_type_to_salary_payments_table` | Adds `employment_type` (full_time/part_time) to `salary_payments`. |
| 24 | `2026_03_15_000001_add_created_by_to_expenses` | Adds `created_by` (nullable FK to users) to `expenses` to track who created the expense (admin vs client). |
| 25 | `2026_03_15_000001_change_salary_rates_year_to_date` | Changes `salary_rates` to use `rate_date` (date) instead of `year` (integer). |
| 26 | `2026_03_15_000002_create_part_times_table` | Creates `part_times`: student_name, schedule, rate_per_hr, duration_hr, amount_to_be_paid (later adds schedule_days). |
| 27 | `2026_03_16_000001_add_schedule_days_to_part_times` | Adds `schedule_days` to `part_times`. |
| 28 | `2026_03_16_000001_add_urgent_rate_to_salary_rates` | Adds `urgent_rate` to `salary_rates`. |
| 29 | `2026_03_16_000002_add_schedule_duration_to_salary_payments` | Adds `schedule_duration` to `salary_payments`. |
| 30 | `2026_03_17_000001_create_part_time_payments_table` | Creates `part_time_payments` for part-time salary payment records. |
| 31 | `2026_03_18_000001_decrypt_card_name_on_cards_table` | Decrypts `name` on `cards` so card name is stored and displayed as plain text; `last_four` and `bank_name` remain encrypted. |

---

## Role column (`users.role`)

- **Migration**: `2026_03_10_000010_add_role_to_users_table`
- **Values**: Typically `'admin'` or `'user'`. Default is `'admin'`.
- **Usage**: Backend uses `role` to set `auth.isAdmin` (true only when `role === 'admin'`). Middleware `admin` protects Users and Expenses routes. Frontend uses `auth.isAdmin` to show or hide Users and Expenses in the sidebar and to scope dashboard/settings/cards behavior.
- **Note**: If `role` is null or missing, the app treats it as `'admin'` everywhere (shared auth, middleware, controllers) so existing accounts and misconfigured admins are not blocked with 403.

---

## Optional seeders

After migrations, you can seed reference data:

**Features** (e.g. cards, expense_tracker, salary_monitoring):

```bash
php artisan db:seed --class=FeatureSeeder
```

**Card types** (e.g. VISA, Mastercard):

```bash
php artisan db:seed --class=CardTypeSeeder
```

Or add them manually under **Settings → Card types** (admin only).

**Expense types** (e.g. Airlines, Hotel, Restaurant, Grocery):

```bash
php artisan db:seed --class=ExpenseTypeSeeder
```

**Payment terms** (e.g. 3, 6, 9, 12 months):

```bash
php artisan db:seed --class=PaymentTermSeeder
```

---

## Dependencies between migrations

- **card_types** must exist before **cards** can reference `card_type_id` (migration 7).
- **expense_types** and **payment_terms** must exist before **expenses** can reference them (migrations 8–11).
- **users** must exist before **cards**, **expenses**, **salary_classes**, **salary_rates**.
- **features** and **feature_user** before assigning features to users (migration 19).
- **salary_classes** and **salary_rates** before **salary_payments** (migrations 20–22).

Laravel’s migration order (by filename) satisfies these dependencies.
