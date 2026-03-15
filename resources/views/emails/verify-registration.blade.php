<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your email – {{ config('app.name') }}</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #1E3A8A; max-width: 600px; margin: 0 auto; padding: 20px;">
    <p style="margin-bottom: 24px;">
        <img src="{{ rtrim(config('app.url'), '/') }}/favicon.ico" alt="{{ config('app.name') }}" width="32" height="32" style="vertical-align: middle; width: 32px; height: 32px;">
        <span style="font-size: 1.25rem; font-weight: 600; vertical-align: middle;">{{ config('app.name') }}</span>
    </p>
    <h1 style="font-size: 1.25rem;">Verify your email</h1>
    <p>Hello {{ $user->name }},</p>
    <p>Thank you for registering. Please click the link below to verify your email and activate your account. This link will expire in 24 hours.</p>
    <p style="margin: 24px 0;">
        <a href="{{ $verificationUrl }}" style="display: inline-block; padding: 12px 24px; background: #2563EB; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Activate account</a>
    </p>
    <p style="font-size: 0.875rem; color: #64748b;">If you did not create an account, you can ignore this email.</p>
</body>
</html>
