# Customizing Emails

## 1. Verification email (sign-up)

**Delivery:** Registration sends the email **after the HTTP response** (`dispatch(...)->afterResponse()` + `Mail::send()`), so signup stays fast and you **do not need** `php artisan queue:work` for activation mail (unlike `Mail::queue()` with `QUEUE_CONNECTION=database`).

**Login:** Users with `email_verified_at` null **cannot sign in** until they open the link in the email (`LoginController` enforces this).

**Subject and “from”:**  
Edit `app/Mail/VerifyRegistrationMail.php`.

- **Subject:** Change the `subject` in the `envelope()` method (e.g. `'Verify your email'`).
- **Reply-To:** Change `replyTo` in `envelope()` if needed.
- **Link expiry:** The verification link expiry is set in `content()` (e.g. `now()->addDays(1)` for 24 hours).

**Body (HTML):**  
Edit `resources/views/emails/verify-registration.blade.php`.

- Change the title, copy, and button text.
- You can use:
  - `{{ $user->name }}` – user’s name
  - `{{ $user->email }}` – user’s email
  - `{{ $verificationUrl }}` – the verification link (keep this for the button/link)
- Adjust inline styles (colors, font-size, padding) to match your branding.

---

## 2. Password reset email

The app sends the reset notification **after the HTTP response** (same pattern as registration), so you **do not need** `queue:work` for the reset email to go out.

The app uses Laravel’s built-in password reset. To customize the email:

**Option A – Override the notification (recommended)**

1. Create a custom notification:
   ```bash
   php artisan make:mail ResetPasswordMail
   ```
   Or copy Laravel’s reset notification and change the view.  
   Then in `app/Models/User.php`, adjust `sendPasswordResetNotification()` (it currently dispatches Laravel’s `ResetPassword` notification **after the response**; replace or wrap that call with your custom mail/notification).

**Option B – Publish and edit Laravel’s view**

1. Publish the reset notification view:
   ```bash
   php artisan vendor:publish --tag=laravel-notifications
   ```
2. Edit the published view (e.g. `resources/views/vendor/notifications/email.blade.php` or the reset-specific view) to change layout and text.

---

## 3. Global “from” name and address

In `.env`:

- `MAIL_FROM_ADDRESS` – sender email (e.g. `noreply@yourdomain.com`).
- `MAIL_FROM_NAME` – sender name (e.g. `"Cardflow"` or `"${APP_NAME}"`).

All emails use these unless a Mailable sets its own in `envelope()`.

---

## 4. Adding new emails

1. Create a Mailable: `php artisan make:mail YourMailName`
2. In the Mailable class, set `envelope()` (subject, from, reply-to) and `content()` (view and data).
3. Create a Blade view under `resources/views/emails/` (e.g. `your-mail-name.blade.php`).
4. Send it with: `Mail::to($user->email)->send(new YourMailName($data));`
