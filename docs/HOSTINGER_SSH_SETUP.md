# Hostinger SSH setup for Cardflow

**Run all commands below in your own terminal.** You’ll be prompted for your SSH password when connecting. Do not share that password in chat or store it in scripts.

Connect via SSH:

```bash
ssh -p 65002 u845249598@82.25.87.4
```

When connected, **find where the Laravel app is** (you may not see `artisan`/`composer.json` if you’re in the wrong folder):

```bash
# Find Laravel project root (directory that contains artisan)
find ~ -name 'artisan' -type f 2>/dev/null

# Also list common locations
ls -la ~
ls -la ~/public_html 2>/dev/null
ls -la ~/domains 2>/dev/null
ls -la ~/domains/cardflow.it 2>/dev/null
```

Use the **directory that contains `artisan`** as your project root for all following steps (e.g. if you see `/home/u845249598/domains/cardflow.it/public_html/artisan`, then project root is `/home/u845249598/domains/cardflow.it/public_html`).

---

## 1. Go to your project root

Replace `PROJECT_ROOT` with the path you found above (the folder that contains `artisan`):

```bash
cd PROJECT_ROOT
# Example:
# cd ~/domains/cardflow.it/public_html
pwd
ls -la
```

You should see `artisan`, `composer.json`, `app/`, `public/`. If not, run the “find artisan” commands in Step 0 again and use that directory.

---

## 2. Create .env from example

```bash
cp .env.example .env
php artisan key:generate
```

---

## 3. Edit .env with production values

```bash
nano .env
```

Set at least these (use your real Hostinger DB and URL):

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://cardflow.it`
- `DB_HOST=` (from Hostinger DB panel, often `localhost` or a hostname)
- `DB_DATABASE=` (your DB name)
- `DB_USERNAME=` (your DB user)
- `DB_PASSWORD=` (your DB password)
- `ADMIN_EMAIL=admin@cardflow.it` (or your choice)
- `ADMIN_PASSWORD=` (set a strong password; used by AdminUserSeeder)

Save: **Ctrl+O**, Enter. Exit: **Ctrl+X**.

---

## 4. Install PHP dependencies (if not already deployed)

```bash
composer install --no-dev --optimize-autoloader
```

---

## 5. Set storage and cache permissions

```bash
chmod -R 775 storage bootstrap/cache
```

If you get permission errors, try:

```bash
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

---

## 6. Run migrations

```bash
php artisan migrate --force
```

---

## 7. Create storage link

```bash
php artisan storage:link
```

---

## 8. (Optional) Seed admin user

```bash
php artisan db:seed --class=AdminUserSeeder
```

(Make sure `ADMIN_PASSWORD` is set in `.env` first.)

---

## 9. Clear and cache config

```bash
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 10. Verify

```bash
php artisan --version
```

Then open https://cardflow.it in your browser. You should see the app or the login page.

---

## Quick one-shot (after .env is set)

If `.env` already exists and has correct DB and APP_KEY, you can run:

```bash
cd ~/domains/cardflow.it/public_html
chmod -R 775 storage bootstrap/cache
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
```

---

## Document root reminder

In Hostinger (hPanel), the domain **cardflow.it** must have **Document root** set to the `public` folder (e.g. `public_html/public` or the path that contains `index.php`).

---

## Update Hostinger from GitHub

After you push changes to GitHub, update the app on Hostinger:

**Repository:** [https://github.com/LowProgram1/Web-Applications.git](https://github.com/LowProgram1/Web-Applications.git)

1. SSH in and go to the Laravel project root (the folder that contains `artisan`):

   ```bash
   ssh -p 65002 u845249598@82.25.87.4
   cd PROJECT_ROOT   # e.g. ~/domains/cardflow.it/public_html
   ```

2. Pull the latest code:

   ```bash
   git pull origin main
   # Or your deploy branch: git pull origin feat-admin-setup
   ```

3. Run deploy steps (composer, migrations, cache):

   ```bash
   bash deploy.sh
   ```

   If `deploy.sh` is not present, run manually:

   ```bash
   composer install --no-dev --optimize-autoloader
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

---

## Security

- **Change your Hostinger SSH password** after setup (hPanel → SSH Access).
- Never commit `.env` or put passwords in scripts or chat.
