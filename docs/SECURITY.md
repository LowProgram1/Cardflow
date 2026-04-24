# Security

This document summarizes the web security measures implemented to reduce the risk of common attacks.

## Implemented measures

### 1. HTTP security headers (middleware: `SecurityHeaders`)

- **X-Frame-Options: SAMEORIGIN** – Reduces clickjacking (app cannot be embedded in iframes from other origins).
- **X-Content-Type-Options: nosniff** – Prevents MIME sniffing (e.g. treating a JSON response as script).
- **X-XSS-Protection: 1; mode=block** – Legacy XSS filter for older browsers.
- **Referrer-Policy: strict-origin-when-cross-origin** – Limits referrer leakage to other sites.
- **Permissions-Policy** – Disables geolocation, microphone, camera, payment, USB.
- **Cross-Origin-Opener-Policy: same-origin** – Isolates the app from cross-origin windows.
- **Cross-Origin-Resource-Policy: same-origin** – Prevents other origins from loading your pages as resources.
- **Content-Security-Policy (CSP)** – Restricts script, style, image, font, and connect sources to same-origin; `frame-ancestors 'self'`; `base-uri 'self'`; `form-action 'self'`; `object-src 'none'`. In production over HTTPS, `upgrade-insecure-requests` is added.
- **Strict-Transport-Security (HSTS)** – When the request is already HTTPS, sets `max-age=31536000; includeSubDomains; preload` to enforce HTTPS.

### 2. Rate limiting

- **auth** – 5 requests per minute per IP for login, register, and forgot-password.
- **auth-sensitive** – 3 requests per minute per IP for password reset submission.
- **exports** – 10 requests per minute per user for PDF export (salary).

Reduces brute-force and credential stuffing on login/register and limits export abuse.

### 3. Host header validation (middleware: `ValidateHost`)

If `ALLOWED_HOSTS` is set in `.env` (comma-separated list of host names), requests with any other `Host` header are rejected with 400. Prevents host header injection and cache poisoning. Leave unset for local development.

### 4. Open redirect prevention

`App\Helpers\SafeRedirect::intended()` is used after login so redirects only go to same-origin or relative URLs. Prevents open redirect attacks via `url.intended` or similar.

### 5. CSRF protection

Laravel’s CSRF middleware is enabled for all web routes. All state-changing requests must include a valid `X-CSRF-TOKEN` or `_token` (or cookie).

### 6. Session and cookies

- Session driver is configurable (e.g. database).
- `SESSION_ENCRYPT=true` encrypts session payload at rest (enabled by default in this project).
- `SESSION_LIFETIME` controls idle timeout in minutes; default is **120** (auto-logout after inactivity).
- `SESSION_SAME_SITE=lax` is set to limit cross-site request exposure.
- **Production:** Also set `SESSION_SECURE_COOKIE=true` (requires HTTPS).
- Cookies are `http_only` by default to limit XSS impact.

> **Note:** Changing `SESSION_ENCRYPT` from false → true invalidates all existing sessions. Flush the sessions table (`DELETE FROM sessions`) after toggling this setting.

### 7. Password policy

Default password rules (in `AppServiceProvider`): minimum 12 characters, letters (mixed case), numbers, and symbols.

### 8. Authorization

- Admin-only routes use `admin` middleware.
- Feature-gated routes use `feature:*` middleware.
- Controllers enforce ownership (e.g. user can only access their own cards, expenses).

## Production checklist

- [ ] Set `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://yourdomain.com`.
- [ ] Use HTTPS only; ensure reverse proxy sets `X-Forwarded-Proto` so Laravel sees secure requests.
- [ ] Set `SESSION_SECURE_COOKIE=true` (HTTPS only). `SESSION_ENCRYPT=true` is already on by default.
- [ ] Set `ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com` (no spaces).
- [ ] Keep `APP_KEY` secret and never change it after encrypting data (e.g. card fields).
- [ ] Run `php artisan config:cache` and `php artisan route:cache` in production.
- [ ] Run `composer install --no-dev` in production.
- [ ] Restrict database user to minimal required privileges; use strong DB password.
- [ ] Regularly run `composer audit` and `npm audit` and address vulnerabilities.

## Reporting vulnerabilities

If you discover a security issue, please report it privately (e.g. to the maintainers) rather than in a public issue.
