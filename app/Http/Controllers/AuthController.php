<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle user registration.
     * Always forces role=customer � never trust client-provided role.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);
        $user->role = UserRole::Customer;
        $user->save();

        Auth::login($user);

        return response()->json($user);
    }

    /**
     * Handle user login.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        $request->session()->regenerate();

        return response()->json(Auth::user());
    }

    /**
     * Handle user logout.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Get the authenticated user.
     */
    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Update user profile / password.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'current_password' => 'nullable|string|required_with:new_password',
            'new_password' => 'nullable|string|min:6|confirmed',
        ]);

        $user->name = $validated['name'];

        if ($request->filled('new_password')) {
            if (!Hash::check($validated['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['The provided password does not match your current password.'],
                ]);
            }
            $user->password = Hash::make($validated['new_password']);
        }

        $user->save();

        return response()->json($user);
    }

    /**
     * Request account deletion (sets deletion_requested_at and logs out all sessions).
     * Requires password re-verification for this sensitive action.
     */
    public function requestAccountDeletion(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided password does not match your current password.'],
            ]);
        }

        $user->requestDeletion();

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Account marked for deletion. It will be permanently removed after 30 days.',
            'deletion_requested_at' => $user->deletion_requested_at,
        ]);
    }

    /**
     * Cancel account deletion request.
     */
    public function cancelAccountDeletion(Request $request)
    {
        $user = $request->user();
        $user->cancelDeletion();

        return response()->json([
            'message' => 'Account deletion request has been canceled.',
            'user' => $user,
        ]);
    }
}

