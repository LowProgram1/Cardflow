#!/bin/bash
# Run this script on the server after every `git pull` (e.g. Hostinger).
# Usage: bash deploy.sh   or   ./deploy.sh

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

# Run migrations (--force for non-interactive)
php artisan migrate --force

# Ensure storage link exists (ignore error if already linked)
php artisan storage:link 2>/dev/null || true

echo "Deploy finished."
