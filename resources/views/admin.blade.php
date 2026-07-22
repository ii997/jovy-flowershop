<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="description" content="Admin management console for Jovy's Flowershop.">
        
        {{-- Canonical URL --}}
        <link rel="canonical" href="{{ url()->current() }}">

        <title>Admin Dashboard | Jovy's Flowershop</title>

        @fonts

        <!-- Styles / Scripts -->
        @vite(['resources/css/app.css', 'resources/js/admin.tsx'])
    </head>
    <body class="bg-[#FAF9F6] text-[#0A2A1B] antialiased">
        <div id="root"></div>
    </body>
</html>
