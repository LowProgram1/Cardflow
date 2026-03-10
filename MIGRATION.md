# Database migrations

## How to run or update migrations

### First-time setup (fresh database)

From the project root:

```bash
php artisan migrate
```

This runs all pending migrations in order and creates/updates tables.

### After pulling new migrations (e.g. new `card_types` or altered `cards`)

Run pending migrations only:

```bash
php artisan migrate
```

Laravel will run only migrations that have not yet been executed. Existing data is preserved.

### Resetting the database (destructive)

To drop all tables and re-run every migration from scratch (e.g. for a clean dev environment):

```bash
php artisan migrate:fresh
```

**Warning:** This deletes all data. Do not use on production.

### Rollback (undo last batch)

To roll back the last migration batch:

```bash
php artisan migrate:rollback
```

### Seed card types (optional)

After running migrations, you can add default card types (e.g. VISA, Mastercard) from the app:

1. Go to **Card types** in the sidebar.
2. Click **+ New card type** and add entries such as `VISA` and `Mastercard`.

Or seed default card types (VISA, Mastercard) via Artisan:

```bash
php artisan db:seed --class=CardTypeSeeder
```

### Seed expense types and payment terms (optional)

For the expense form (type of expense dropdown and installment terms):

```bash
php artisan db:seed --class=ExpenseTypeSeeder
php artisan db:seed --class=PaymentTermSeeder
```

This adds expense types (e.g. Airlines, Hotel, Restaurant, Grocery) and payment terms (3, 6, 9, 12 months). You can also manage these under **Settings → Expense types** and **Settings → Payment terms**.

---

## Summary of migrations used for the credit card form

- **`create_card_types_table`** – Creates `card_types` (id, name) for dynamic card type list (VISA, Mastercard, etc.).
- **`alter_cards_table_add_bank_and_statement`** – Adds to `cards`: `bank_name`, `card_type_id` (FK to `card_types`), `statement_day` (replaces `closing_day`). Removes `closing_day`.

Ensure migrations run in order: `card_types` must exist before altering `cards` (foreign key).

## Summary of migrations for expenses

- **`create_expense_types_table`** – Creates `expense_types` (id, name) for the expense form (e.g. Airlines, Hotel, Restaurant, Grocery). Managed in **Settings → Expense types**.
- **`create_payment_terms_table`** – Creates `payment_terms` (id, months) for installment options (e.g. 3, 6, 9, 12). Managed in **Settings → Payment terms**.
- **`alter_expenses_add_type_and_payment_fields`** – Adds to `expenses`: `expense_type_id`, `payment_type` (full/installment), `payment_term_id`, `monthly_amortization`.
