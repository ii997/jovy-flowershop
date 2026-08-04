<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminSessionTimeout
{
    /**
     * Enforces a shorter session lifetime for admin/staff users.
     *
     * After 30 minutes of inactivity (configurable via ADMIN_SESSION_LIFETIME env),
     * the user's session is invalidated, and they are logged out.
     * Regular customer users are not affected.
     *
     * Uses a database column (last_admin_activity) rather than session storage so
     * the inactivity window is tracked server-side and persists across browser sessions.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && in_array($user->role, [\App\Enums\UserRole::Admin, \App\Enums\UserRole::Staff], true)) {
            $lastActivity = $user->last_admin_activity;
            $adminLifetime = (int) env('ADMIN_SESSION_LIFETIME', 30);

            $now = now();

            if ($lastActivity && $now->diffInMinutes($lastActivity, true) >= $adminLifetime) {
                // Double-check: a concurrent request may have already refreshed the session
                $freshUser = $user->fresh();
                if ($freshUser && $freshUser->last_admin_activity) {
                    $freshDiff = $now->diffInMinutes($freshUser->last_admin_activity, true);
                    if ($freshDiff < $adminLifetime) {
                        return $next($request);
                    }
                }

                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Your session has expired due to inactivity. Please log in again.',
                    ], 401);
                }

                return redirect('/')->with('message', 'Your session has expired. Please log in again.');
            }

            // Throttle DB writes: only persist activity timestamp if more than 1 minute has elapsed
            // since the last recorded activity, avoiding an UPDATE on every read-only admin request.
            if ($lastActivity === null || $now->diffInMinutes($lastActivity, true) >= 1) {
                $user->timestamps = false;
                $user->last_admin_activity = $now;
                $user->save();
            }
        }

        return $next($request);
    }
}
