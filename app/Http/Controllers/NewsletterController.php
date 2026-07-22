<?php

namespace App\Http\Controllers;

use App\Models\NewsletterSubscription;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class NewsletterController extends Controller
{
    /**
     * Subscribe an email to the newsletter.
     */
    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email|max:255|unique:newsletter_subscriptions,email',
        ]);

        $subscription = NewsletterSubscription::create([
            'email' => $validated['email'],
            'subscribed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Thank you for subscribing! Check your inbox for a welcome email.',
            'subscription' => $subscription,
        ], 201);
    }
}
