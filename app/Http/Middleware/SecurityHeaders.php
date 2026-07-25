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

        // Detect dynamic Vite dev server if running
        $isViteDev = file_exists(public_path('hot'));
        $viteUrl = '';
        $viteWsUrl = '';
        if ($isViteDev) {
            try {
                $viteUrl = trim(file_get_contents(public_path('hot')));
                $viteWsUrl = str_replace(['http://', 'https://'], ['ws://', 'wss://'], $viteUrl);
            } catch (\Exception) {
                // Fallback
            }
        }

        // Content Security Policy supporting Nonces, Web Workers, Tesseract OCR CDNs & Vite dev server
        $csp = "default-src 'self'; " .
               "script-src 'self' 'nonce-{$nonce}' 'unsafe-inline' 'unsafe-eval' blob: https: https://cdn.jsdelivr.net https://unpkg.com; " .
               "worker-src 'self' blob: data: https: https://cdn.jsdelivr.net https://unpkg.com; " .
               "object-src 'none'; " .
               "base-uri 'self'; " .
               "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " .
               "font-src 'self' https://fonts.gstatic.com" . ($viteUrl ? " {$viteUrl}" : "") . "; " .
               "img-src 'self' data: blob: https: " . ($viteUrl ?: "") . "; " .
               "connect-src 'self' blob: data: https: https://cdn.jsdelivr.net https://unpkg.com https://tessdata.projectnaptha.com " . ($viteUrl ? "{$viteUrl} {$viteWsUrl}" : "") . "; " .
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
