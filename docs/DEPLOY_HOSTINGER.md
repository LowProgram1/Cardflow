# Deploy Cardflow to Hostinger Using GitHub

This guide covers deploying the Cardflow Laravel app to Hostinger with a **GitHub-based flow**: push to GitHub → Hostinger pulls (or receives webhook) → run build steps.

---

## Overview of options

| Option | Best for | Auto-deploy on push? |
|--------|----------|----------------------|
| **A. Shared hosting + Git** | Low cost, simple sites | Yes (via webhook) |
| **B. VPS + GitHub Actions** | Full control, Docker | Yes (GitHub Actions) |
| **C. VPS or shared + SSH** | Manual control | No (run script after `git pull`) |

---

## Option A: Hostinger shared hosting + Git (webhook auto-deploy)

Use Hostinger’s built-in **Git** feature so each push to GitHub can trigger a deploy.

### 1. Prepare your GitHub repository

- Code is on GitHub: [https://github.com/LowProgram1/Web-Applications.git](https://github.com/LowProgram1/Web-Applications.git)
- Ensure the branch you want to deploy (e.g. `main`) is up to date.

### 2. Connect GitHub in Hostinger (hPanel)

1. Log in to **hPanel** → open your **Hosting** plan.
2. Click **Manage** next to the domain you want to use.
3. In the left sidebar, open **Git** (or **Advanced** → **Git**).
4. Click **Create a new repository** (or equivalent).
5. Set:
   - **Repository address:** `https://github.com/LowProgram1/Web-Applications.git`  
     (for private repo, use SSH URL and add a deploy key in GitHub.)
   - **Branch:** `main` (or your production branch).
   - **Install path:**  
     - Leave **empty** to deploy into the account root (`public_html`’s parent), or  
     - Set e.g. `cardflow` to deploy into `domains/yourdomain.com/cardflow`.
6. Save. Hostinger will do the first clone.

### 3. Enable auto-deploy (webhook)

1. In the same Git section, turn on **Auto-Deployment**.
2. Copy the **Webhook URL** Hostinger shows.
3. In **GitHub** → your repo → **Settings** → **Webhooks** → **Add webhook**:
   - **Payload URL:** paste the Hostinger webhook URL.
   - **Content type:** `application/json`.
   - **Events:** “Just the push event” (or “Send everything”).
   - Save.

After this, every push to the selected branch will trigger a new deploy (pull) on Hostinger.

### 4. Point the domain to Laravel’s `public` folder

Laravel must be served from the `public` directory.

- **If Hostinger lets you set “Document root” (or “Web root”):**  
  Set it to the folder that contains `index.php` of Laravel, i.e.  
  `public` inside your install path (e.g. `domains/yourdomain.com/public_html` → change to `domains/yourdomain.com/cardflow/public` if you used install path `cardflow`).
- **If you can only use `public_html`:**  
  After the first deploy, either:
  - Move/clone only the **contents** of `public` into `public_html`, and keep the rest of the app outside `public_html`, or  
  - Put the whole repo under `public_html` and set document root to `public_html/cardflow/public` (or similar), if the panel allows it.

### 5. Run build steps after deploy (SSH or “Run script”)

Hostinger’s Git usually only runs `git pull`. You still need to run Laravel’s build steps. If your plan includes **SSH**:

1. SSH into the server and go to your project directory (the Git install path).
2. Run the **deploy script** once (first time and after each deploy):

   ```bash
   bash deploy.sh
   ```

   Or run the same steps manually (see “Deploy script” below).

If you **don’t have SSH**, check in hPanel for “Run script after deploy” or “Deploy script” and paste the same commands there; otherwise you may need to run them via **File Manager** terminal or support.

### 6. Configure environment

1. On the server, in the project root, create `.env` from the example:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` (File Manager or SSH) and set at least:
   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - `APP_URL=https://yourdomain.com`
   - `APP_KEY=` (generate with `php artisan key:generate` once)
   - `DB_*` (database credentials from hPanel → Databases)
   - `SESSION_DRIVER=database` (or `file` if you prefer)

3. **First time only:** generate key and run migrations:

   ```bash
   php artisan key:generate
   php artisan migrate --force
   php artisan storage:link
   ```

---

## Option B: Hostinger VPS + GitHub Actions

Use a **Hostinger VPS** and deploy via **GitHub Actions** on every push.

### 1. Prerequisites

- Hostinger **VPS** with **Docker** (e.g. “Docker” or “Laravel” template in hPanel).
- In hPanel → **Profile** → **API**: create an **API key**.
- **VPS VM ID:** from the VPS hostname (e.g. `srv123456.hstgr.cloud` → VM ID `123456`).

### 2. GitHub Secrets and variables

In GitHub → repo → **Settings** → **Secrets and variables** → **Actions**:

- **Secret:** `HOSTINGER_API_KEY` = your Hostinger API key.
- **Variable:** `HOSTINGER_VM_ID` = VM ID (e.g. `123456`).
- If the repo is **private**, add **Secret:** `PERSONAL_ACCESS_TOKEN` = a GitHub token with `repo` scope.

### 3. Add a workflow file

Create `.github/workflows/deploy-hostinger.yml` in your repo:

```yaml
name: Deploy to Hostinger VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Hostinger
        uses: hostinger/deploy-action@v1
        with:
          api-key: ${{ secrets.HOSTINGER_API_KEY }}
          virtual-machine: ${{ vars.HOSTINGER_VM_ID }}
          project-name: cardflow
          # For private repo:
          # personal-token: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
          docker-compose-path: docker-compose.yml
```

This expects a **Docker** setup (e.g. `docker-compose.yml` in the repo). For a plain Laravel app you would either:

- Add a `docker-compose.yml` (and Dockerfile) for PHP + web server + DB, or  
- Use a different approach: e.g. GitHub Actions SSH into the VPS and run `git pull` + `deploy.sh` (Option C style).

---

## Option C: Manual Git flow (VPS or shared with SSH)

No webhook; you deploy by pulling on the server and running the script.

### 1. First-time setup on the server

1. SSH into Hostinger (VPS or shared with SSH).
2. Go to the directory you want the app in (e.g. `~/domains/yourdomain.com`).
3. Clone the repo:

   ```bash
   git clone https://github.com/LowProgram1/Web-Applications.git cardflow
   cd cardflow
   ```

4. Configure `.env` (as in Option A, step 6).
5. Run the deploy script:

   ```bash
   bash deploy.sh
   ```

6. Point the domain’s document root to `cardflow/public` (or your equivalent).

### 2. Deploy updates (after each release)

```bash
cd /path/to/cardflow
git pull origin main
bash deploy.sh
```

---

## Deploy script (post–git pull steps)

Save this as **`deploy.sh`** in the project root and run it after every `git pull` (Options A and C).

```bash
#!/bin/bash
set -e
echo "Running deploy..."

# Install PHP dependencies (no dev packages in production)
composer install --no-dev --optimize-autoloader

# Install and build frontend
npm ci
npm run build

# Laravel optimizations
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations (optional: add --force for non-interactive)
php artisan migrate --force

# Ensure storage link exists
php artisan storage:link 2>/dev/null || true

echo "Deploy finished."
```

Make it executable once: `chmod +x deploy.sh`.

---

## Checklist before going live

- [ ] `.env`: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` correct.
- [ ] `APP_KEY` generated; never commit `.env` to GitHub.
- [ ] Database created in hPanel; `DB_*` set in `.env`.
- [ ] Document root points to Laravel’s **public** folder (`/public`).
- [ ] Run `php artisan storage:link` so `storage/app/public` is linked.
- [ ] For production: set `SESSION_SECURE_COOKIE=true` and `SESSION_ENCRYPT=true` when using HTTPS.
- [ ] Optional: set `ALLOWED_HOSTS=yourdomain.com` in `.env` (see [docs/SECURITY.md](SECURITY.md)).

---

## Quick reference

| Task | Command / place |
|------|------------------|
| First-time deploy | Clone repo → `.env` → `bash deploy.sh` |
| After each push (webhook) | Hostinger pulls; you run `bash deploy.sh` (Option A) |
| After each push (VPS + Actions) | Workflow runs (Option B) |
| Manual deploy | `git pull` then `bash deploy.sh` (Option C) |
| Clear config cache | `php artisan config:clear` |
| Run migrations | `php artisan migrate --force` |

---

## Links

- [Hostinger: Deploy a Git repository](https://support.hostinger.com/en/articles/1583302-how-to-deploy-a-git-repository-in-hostinger)
- [Hostinger: Deploy to VPS using GitHub Actions](https://www.hostinger.com/support/deploy-to-hostinger-vps-using-github-actions/)
- Repository: [https://github.com/LowProgram1/Web-Applications.git](https://github.com/LowProgram1/Web-Applications.git)
