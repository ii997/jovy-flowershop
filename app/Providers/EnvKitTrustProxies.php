<?php

namespace App\Providers;

use Illuminate\Http\Request;
use Illuminate\Support\ServiceProvider;

/**
 * Added by EnvKit so shared (ngrok) URLs work: trust the local reverse proxy
 * (nginx) and honor X-Forwarded-* so asset()/url() use the public host + https.
 * Safe for local development. Delete this file (and its line in
 * bootstrap/providers.php) to opt out.
 */
class EnvKitTrustProxies extends ServiceProvider
{
    public function boot(): void
    {
        // Only trust local proxy IPs in non-production environments
        if (app()->environment('production')) {
            return;
        }

        Request::setTrustedProxies(
            ['127.0.0.1', '::1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
            Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO
        );
    }
}
