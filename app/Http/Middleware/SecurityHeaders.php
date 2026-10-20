<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Vite;

class SecurityHeaders
{
    /**
     * Apply security-related HTTP headers to every response.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Generate dynamic CSP nonce BEFORE view rendering so @vite() can use it
        $nonce = bin2hex(random_bytes(16));
        Vite::useCspNonce($nonce);

        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // The hot file exists only while Vite's development server is running.
        $isViteDev = file_exists(public_path('hot'));

        // Chromium rejects IPv6 loopback URLs such as http://[::1]:5173 as CSP
        // host sources. In dev, allow only the actual Vite origin from the hot file;
        // production remains nonce-based and does not permit arbitrary external scripts.
        $viteOrigin = '';
        if ($isViteDev) {
            $viteUrl = trim((string) @file_get_contents(public_path('hot')));
            $parsedViteUrl = parse_url($viteUrl);
            if (is_array($parsedViteUrl) && isset($parsedViteUrl['scheme'], $parsedViteUrl['host'])) {
                $viteOrigin = $parsedViteUrl['scheme'].'://'.$parsedViteUrl['host']
                    .(isset($parsedViteUrl['port']) ? ':'.$parsedViteUrl['port'] : '');
            }
        }
        $viteWsOrigin = $viteOrigin !== ''
            ? preg_replace('/^https?:/', static fn (array $match): string => $match[0] === 'https:' ? 'wss:' : 'ws:', $viteOrigin)
            : '';
        $scriptSrc = $isViteDev
            ? "'self' 'unsafe-inline' 'unsafe-eval' blob: {$viteOrigin} https://cdn.jsdelivr.net https://unpkg.com"
            : "'nonce-{$nonce}' 'strict-dynamic' 'self' 'unsafe-eval' blob: https://cdn.jsdelivr.net https://unpkg.com";
        $styleSrc = "'self' 'unsafe-inline' https://fonts.googleapis.com" . ($viteOrigin !== '' ? " {$viteOrigin}" : '');
        $fontSrc = "'self' https://fonts.gstatic.com" . ($viteOrigin !== '' ? " {$viteOrigin}" : '');
        $imgSrc = "'self' data: blob: https:" . ($viteOrigin !== '' ? " {$viteOrigin}" : '');
        $connectSrc = "'self' blob: data: https://tessdata.projectnaptha.com https://cdn.jsdelivr.net"
            . ($viteOrigin !== '' ? " {$viteOrigin} {$viteWsOrigin}" : '');
        $csp = "default-src 'self'; " .
               "script-src {$scriptSrc}; " .
               "worker-src 'self' blob: data: https://cdn.jsdelivr.net; " .
               "object-src 'none'; " .
               "base-uri 'self'; " .
               "style-src {$styleSrc}; " .
               "font-src {$fontSrc}; " .
               "img-src {$imgSrc}; " .
               "connect-src {$connectSrc}; " .
               "form-action 'self'; " .
               "frame-ancestors 'none';";

        $response->headers->set('Content-Security-Policy', $csp);

        // HTTP Strict Transport Security (HSTS) — enforces HTTPS for 1 year, includes subdomains
        // Only set when the request is over HTTPS — HSTS headers over HTTP are ignored by browsers
        // but could cause confusion during local dev without HTTPS.
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // Permissions Policy — restricts browser features (geolocation, camera, etc.)
        $response->headers->set('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()');

        return $response;
    }
}
