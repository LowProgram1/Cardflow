<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

        <title inertia>{{ config('app.name', 'CardFlow') }}</title>
        @php $faviconPath = public_path('favicon.ico'); @endphp
        @if(file_exists($faviconPath))
        <link rel="icon" href="{{ asset('favicon.ico') }}?v={{ filemtime($faviconPath) }}" type="image/x-icon">
        @endif
        @vite(['resources/css/app.css', 'resources/js/app.js'])
        @inertiaHead
    </head>
    <body class="min-h-screen bg-[#E5E7EB] text-[#1E3A8A] antialiased">
        @inertia
    </body>
</html>

