<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="description" content="Bespoke, luxury floral arrangements handpicked and styled to order. Shop fresh roses, seasonal tulips, and exotic plants with same-day hand delivery.">
        
        {{-- Canonical URL --}}
        <link rel="canonical" href="{{ url()->current() }}">

        {{-- Open Graph / Social Meta Tags --}}
        <meta property="og:type" content="website">
        <meta property="og:title" content="Jovy's Flowershop | Artisanal Floral Arrangements & Bouquets">
        <meta property="og:description" content="Bespoke, luxury floral arrangements handpicked and styled to order. Shop fresh roses, seasonal tulips, and exotic plants with same-day hand delivery in Metro Manila.">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:site_name" content="Jovy's Flowershop">
        <meta property="og:locale" content="{{ str_replace('_', '-', app()->getLocale()) }}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="Jovy's Flowershop | Artisanal Floral Arrangements & Bouquets">
        <meta name="twitter:description" content="Bespoke, luxury floral arrangements handpicked and styled to order. Shop fresh roses, seasonal tulips, and exotic plants with same-day hand delivery in Metro Manila.">

        <title>Jovy's Flowershop | Artisanal Floral Arrangements & Bouquets</title>

        @fonts

        <!-- Styles / Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])

        <!-- JSON-LD Structured Data / Schema Markup -->
        <script type="application/ld+json" nonce="{{ Vite::cspNonce() }}">
        {
          "@@context": "https://schema.org",
          "@@type": "Florist",
          "name": "Jovy's Flowershop",
          "image": "https://jovyflowershop.com/images/roses.png",
          "priceRange": "$$",
          "telephone": "+63-2-555-1234",
          "address": {
            "@@type": "PostalAddress",
            "streetAddress": "123 Rizal Avenue, Brgy. San Antonio",
            "addressLocality": "Makati City",
            "addressRegion": "Metro Manila",
            "postalCode": "1203",
            "addressCountry": "PH"
          },
          "openingHoursSpecification": [
            {
              "@@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday"
              ],
              "opens": "08:00",
              "closes": "19:00"
            },
            {
              "@@type": "OpeningHoursSpecification",
              "dayOfWeek": "Saturday",
              "opens": "09:00",
              "closes": "18:00"
            }
          ]
        }
        </script>
    </head>
    <body class="bg-[#FAF9F6] text-[#0A2A1B] antialiased">
        <div id="root"></div>
    </body>
</html>
