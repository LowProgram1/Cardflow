#!/bin/bash
# Run this on Hostinger via SSH after cloning/deploying the app.
# Usage: bash setup-hostinger.sh
# Ensure .env exists (copy from .env.example and edit DB_*, APP_URL, etc.) before running.

set -e
echo "Cardflow Hostinger setup..."

if [ ! -f artisan ]; then
    echo "Error: Run this script from the Laravel project root (where artisan and composer.json are)."
    exit 1
fi

if [ ! -f .env ]; then
    echo ".env not found. Copying from .env.example..."
    cp .env.example .env
    php artisan key:generate
    echo "Please edit .env (nano .env) and set APP_URL, DB_*, ADMIN_PASSWORD, then run this script again."
    exit 0
fi

echo "Setting permissions..."
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

echo "Running migrations..."
php artisan migrate --force

echo "Linking storage..."
php artisan storage:link 2>/dev/null || true

echo "Caching config..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Done. Visit your site and optionally run: php artisan db:seed --class=AdminUserSeeder"
exit 0
