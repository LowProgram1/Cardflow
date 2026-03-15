# Hostinger SSH setup for Cardflow

**Run all commands below in your own terminal.** You’ll be prompted for your SSH password when connecting. Do not share that password in chat or store it in scripts.

---

## Go-live checklist (do in order)

Use this list to get the web app live. All commands run on the server via SSH unless noted.

| # | Step | What to do |
|---|------|------------|
| 1 | **Code on server** | Full Laravel app at e.g. `~/domains/cardflow.it/public_html/` or `~/public_html/cardflow/` (clone via Git or Hostinger Git). Must have `artisan`, `app/`, `public/`, `vendor/`. |
| 2 | **`.env`** | In project root: `cp .env.example .env` then `php artisan key:generate`. Edit `.env`: set `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://cardflow.it`, `DB_*`, and `ADMIN_EMAIL` / `ADMIN_PASSWORD` if you seed admin. |
| 3 | **Composer** | `composer install --no-dev --optimize-autoloader`. If PHP version error, set `config.platform.php` in `composer.json` to your server PHP (e.g. `8.3.0`) or use `--ignore-platform-reqs` once. |
| 4 | **Permissions** | `chmod -R 775 storage bootstrap/cache`. |
| 5 | **Storage link** | `php artisan storage:link` — if you get “exec()” error, run: `ln -s ../storage/app/public public/storage` (from project root). |
| 6 | **Database** | `php artisan migrate --force`. Optionally: `php artisan config:clear` then `php artisan db:seed --class=AdminUserSeeder` then `php artisan config:cache`. |
| 7 | **Cache** | `php artisan config:cache` and `php artisan route:cache` and `php artisan view:cache`. |
| 8 | **Document root** | **If you can change it:** set domain document root to the Laravel **`public`** folder (e.g. `public_html/cardflow/public` or `public_html/public`). **If locked to `public_html`:** use “When document root is locked” below (copy `hostinger-index.php` to `public_html/index.php`, copy `public/.htaccess` to `public_html/.htaccess`, keep app in `public_html/cardflow/`). |
| 9 | **Frontend build** | If using Vite: run build on server (`npm ci && npm run build`) or use Hostinger’s build (Root directory: `.` or `cardflow`, Output directory: `public`). Ensures `public/build/` exists. |
| 10 | **Turn off debug** | In `.env`: `APP_DEBUG=false`. Run `php artisan config:clear` then `php artisan config:cache`. |
| 11 | **Test** | Open `https://cardflow.it`. If 500: set `APP_DEBUG=true`, reload to see error, fix, then set `APP_DEBUG=false` again. |

Details for each step are in the sections below.

---

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

## If you don’t see `artisan` (full app not on server)

If `find ~ -name 'artisan'` finds nothing, the **full Laravel project was never uploaded**. Only the `public` folder or a few files may be there. You need to put the full repo on the server.

**Option A – Clone the repo via SSH (recommended)**

1. SSH in and go to the folder that should contain the app (e.g. your domain’s root):

   ```bash
   ssh -p 65002 u845249598@82.25.87.4
   cd ~/domains/cardflow.it
   # or: cd ~/public_html
   ```

2. If the folder already has content (e.g. a basic `public_html`), either:
   - Use a **subfolder** for the app and point the domain there, or  
   - Back up and remove the contents, then clone into the current folder (see below).

3. Clone the full repo:

   ```bash
   # Clone into a subfolder (e.g. "cardflow") — recommended since public_html may not be empty
   git clone https://github.com/LowProgram1/Web-Applications.git cardflow
   cd cardflow
   ```

   **GitHub auth:** GitHub no longer accepts account passwords for Git. If the repo is **private**, use one of these:
   - **Make the repo public** (GitHub → repo → Settings → Danger zone → Change visibility). Then `git clone` works without login.
   - **Or use a Personal Access Token (PAT):** GitHub → Settings → Developer settings → [Personal access tokens](https://github.com/settings/tokens) → Generate new token (classic), tick `repo`. When `git clone` asks for password, paste the token (not your GitHub password).

4. You should now see `artisan`, `composer.json`, `app/`, `public/`. Continue from **Section 1** below (create `.env`, etc.).

5. In **hPanel** → your domain → set **Document root** to the Laravel `public` folder, e.g.:
   - `domains/cardflow.it/public_html/public` if you cloned into `public_html`, or  
   - `domains/cardflow.it/cardflow/public` if you cloned into `cardflow`.

**Option B – Use Hostinger’s Git in hPanel**

1. In hPanel → **Advanced** → **Git** → **Create repository**.
2. Set **Repository URL:** `https://github.com/LowProgram1/Web-Applications.git`, **Branch:** `main` (or `feat-admin-setup`).
3. Set **Install path** to where you want the app (e.g. leave default or use `cardflow`).
4. Let Hostinger run the first clone, then set the domain’s **Document root** to `install_path/public` (e.g. `public_html/public` or `cardflow/public`).

After the full app is on the server, follow the rest of this guide from Section 1.

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

If you see **"Call to undefined function ... exec()"**, the host has disabled `exec()`. Create the link manually from the project root:

```bash
ln -s ../storage/app/public public/storage
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

In Hostinger (hPanel), the domain **cardflow.it** should have **Document root** set to the `public` folder (e.g. `public_html/cardflow/public`). If your plan allows editing it, set it and you’re done.

---

## When document root is locked (can’t edit, e.g. “default ./”)

If the document root is fixed to `public_html` and you can’t change it, use this setup so Laravel still runs.

**Layout:** Keep the full Laravel app in a subfolder, e.g. `public_html/cardflow/`. The site will be served from `public_html` using a custom `index.php` that boots Laravel from `cardflow/`.

**Steps (on the server, via SSH or File Manager):**

1. **Ensure the app is in a subfolder**
   - You should have: `public_html/cardflow/` containing `artisan`, `app/`, `bootstrap/`, `config/`, `public/`, `storage/`, `vendor/`, etc.

2. **Copy Laravel’s “public” contents into `public_html`**
   - Copy everything inside `public_html/cardflow/public/` into `public_html/` (so `public_html/index.php`, `public_html/.htaccess`, and any build assets).
   - If you already have an `index.php` in `public_html`, replace it in the next step.

3. **Use the Hostinger entrypoint in `public_html`**
   - In the repo there is `public/hostinger-index.php`. It boots Laravel from `public_html/cardflow/`.
   - On the server, copy it over the main entrypoint:
     ```bash
     cp ~/public_html/cardflow/public/hostinger-index.php ~/public_html/index.php
     ```
   - Or via File Manager: copy `cardflow/public/hostinger-index.php` to `public_html/index.php` (overwrite).
   - If your app folder is not named `cardflow`, edit `public_html/index.php` and change the line `$laravelRoot = __DIR__ . '/cardflow';` to your folder name (e.g. `'/myapp'`).

4. **Keep Laravel’s `.htaccess` in `public_html`**
   - Make sure `public_html/.htaccess` is the same as Laravel’s `public/.htaccess` (rewrite rules for `index.php`). Copy from `cardflow/public/.htaccess` if needed.

5. **Asset paths**
   - Laravel’s `APP_URL` and Vite/manifest assume the app is served from the “public” directory. If you use the subfolder setup above, `APP_URL` should still be `https://cardflow.it`; the browser still loads the site from the domain root, and `index.php` in `public_html` loads Laravel from `cardflow/`. If you have build assets (e.g. `build/`) that are 404ing, ensure they were copied into `public_html/` from `cardflow/public/` so they are under the doc root.

After this, the document root stays as `public_html`, and the site should run.

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

## Website not loading – checklist

If the site doesn’t load or shows a blank/500/403 page, check the following.

**1. Document root (most common)**

The domain must point to Laravel’s **`public`** folder, not the project root.

- In **hPanel** → **Domains** (or **Websites**) → **cardflow.it** → **Document root** (or “Root directory”).
- Set it to: **`public_html/cardflow/public`** (so the URL serves from the `public` folder inside `cardflow`).
- If your app is under `domains/cardflow.it/`, the path might be **`domains/cardflow.it/public_html/cardflow/public`** — use whatever path contains Laravel’s `index.php` and `index.php` is the entry point.

**2. Storage link**

If you skipped the manual symlink, run on the server (from project root):

```bash
ln -s ../storage/app/public public/storage
```

**3. Permissions**

From project root on the server:

```bash
chmod -R 775 storage bootstrap/cache
```

**4. What do you see in the browser?**

- **Blank white page:** Enable debug temporarily: in `.env` set `APP_DEBUG=true`, then reload the page and check the error. Set `APP_DEBUG=false` again after.
- **500 Internal Server Error:** Check the server error log (hPanel → **Advanced** → **Error logs**) or run `tail -50 ~/logs/error.log` (path may vary in hPanel).
- **403 Forbidden:** Document root is wrong or permissions; fix document root and run the `chmod` above.
- **“Index of /” or directory listing:** Document root is the project root or `cardflow` instead of `cardflow/public`; change it to `cardflow/public`.

**5. Quick test from the server**

```bash
cd ~/domains/cardflow.it/cardflow
php artisan route:list
php artisan --version
```

If these work, Laravel is fine; the issue is usually document root or permissions.

---

## Security

- **Change your Hostinger SSH password** after setup (hPanel → SSH Access).
- Never commit `.env` or put passwords in scripts or chat.
