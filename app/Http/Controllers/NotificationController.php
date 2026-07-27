<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Enums\UserRole;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get recent notifications for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // If admin/staff, show all admin alerts plus their personal ones
        if ($user->role === UserRole::Admin || $user->role === UserRole::Staff) {
            $notifications = Notification::where('is_admin', true)
                ->orWhere('user_id', $user->id)
                ->latest()
                ->take(50)
                ->get();
        } else {
            // Customers only see their own notifications and never admin alerts
            $notifications = Notification::where('user_id', $user->id)
                ->where('is_admin', false)
                ->latest()
                ->take(50)
                ->get();
        }

        return response()->json($notifications);
    }

    /**
     * Mark notifications as read.
     */
    public function markRead(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $notificationIds = $request->input('ids');

        // Require explicit notification IDs — never allow unintended "mark all as read"
        if (!is_array($notificationIds) || count($notificationIds) === 0) {
            return response()->json(['message' => 'The ids field is required and must be a non-empty array.'], 422);
        }

        $query = Notification::whereNull('read_at');

        if ($user->role === UserRole::Admin || $user->role === UserRole::Staff) {
            // Admins can read admin notifications or personal ones
            $query->where(function ($q) use ($user) {
                $q->where('is_admin', true)->orWhere('user_id', $user->id);
            });
        } else {
            // Customers can only mark their own notifications
            $query->where('user_id', $user->id)->where('is_admin', false);
        }

        if (is_array($notificationIds) && count($notificationIds) > 0) {
            $query->whereIn('id', $notificationIds);
        }

        $query->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
