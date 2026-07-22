<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use libphonenumber\PhoneNumberUtil;
use libphonenumber\PhoneNumberFormat;
use libphonenumber\NumberParseException;

class NotificationService
{
    /**
     * Send in-app and optionally SMS notifications to customers or staff/admin.
     */
    public static function send(
        ?int $userId,
        string $title,
        string $message,
        string $type,
        bool $isAdmin = false,
        bool $sendSms = false,
        ?string $customPhone = null
    ): Notification {
        // 1. Persist the notification in the database
        $notification = Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'is_admin' => $isAdmin,
        ]);

        // 2. Dispatch SMS via httpSMS if requested
        if ($sendSms && !empty($customPhone)) {
            self::dispatchSms($customPhone, $message, $notification);
        }

        return $notification;
    }

    /**
     * Dispatch SMS message via httpSMS REST API.
     */
    protected static function dispatchSms(string $toPhone, string $content, Notification $originalNotification): void
    {
        $apiKey = config('services.httpsms.key');
        $fromPhone = config('services.httpsms.from');

        if (empty($fromPhone)) {
            $settingsPath = storage_path('app/settings.json');
            if (file_exists($settingsPath)) {
                $settings = json_decode(file_get_contents($settingsPath), true);
                $fromPhone = $settings['phone'] ?? null;
            }
        }

        // Format numbers to E.164 format for httpSMS API compliance
        $formattedTo = self::formatPhoneNumber($toPhone);
        $formattedFrom = $fromPhone ? self::formatPhoneNumber($fromPhone) : null;

        if (empty($apiKey) || empty($formattedFrom)) {
            Log::warning("httpSMS Credentials missing. Cannot send SMS to {$formattedTo}.");
            self::logSmsFailure($formattedTo, "API key or 'from' number is not configured in settings or environment.", $originalNotification);
            return;
        }

        try {
            $response = Http::withHeaders([
                'x-api-key' => $apiKey,
                'Accept' => 'application/json',
            ])->timeout(10)->post('https://api.httpsms.com/v1/messages/send', [
                'content' => $content,
                'from' => $formattedFrom,
                'to' => $formattedTo,
            ]);

            if (!$response->successful()) {
                $errorMsg = $response->json('message') ?? $response->body() ?? 'Unknown response error';
                self::logSmsFailure($formattedTo, "API Response Status Code {$response->status()}: {$errorMsg}", $originalNotification);
            }
        } catch (\Exception $e) {
            Log::error("httpSMS Connection failed: " . $e->getMessage());
            self::logSmsFailure($formattedTo, "Connection Error: " . $e->getMessage(), $originalNotification);
        }
    }

    /**
     * Log SMS failures as in-app notification alerts for the admin.
     */
    protected static function logSmsFailure(string $toPhone, string $errorDetails, Notification $originalNotification): void
    {
        Notification::create([
            'user_id' => null,
            'title' => '⚠️ SMS Gateway Alert',
            'message' => "SMS update for Order #JFS-{$originalNotification->id} failed to deliver to {$toPhone}. Error: {$errorDetails}",
            'type' => 'sms_failure',
            'is_admin' => true,
        ]);
    }

    /**
     * Format a phone number to strict E.164 international format (+63...) for httpSMS.
     */
    public static function formatPhoneNumber(string $phone): string
    {
        try {
            $phoneUtil = PhoneNumberUtil::getInstance();
            // Parse with 'PH' (Philippines) as the default region
            $parsedNumber = $phoneUtil->parse($phone, 'PH');
            if ($phoneUtil->isValidNumber($parsedNumber)) {
                return $phoneUtil->format($parsedNumber, PhoneNumberFormat::E164);
            }
        } catch (NumberParseException $e) {
            Log::debug("libphonenumber failed to parse phone '{$phone}': " . $e->getMessage());
        }

        // Remove all non-numeric characters except +
        $cleaned = preg_replace('/[^0-9+]/', '', $phone);

        if (str_starts_with($cleaned, '+')) {
            return $cleaned;
        }

        // If it starts with 09 (Philippine mobile pattern: 09XXXXXXXXX)
        if (str_starts_with($cleaned, '09') && strlen($cleaned) === 11) {
            return '+63' . substr($cleaned, 1);
        }

        // If it starts with 9 (Philippine mobile pattern: 9XXXXXXXXX)
        if (str_starts_with($cleaned, '9') && strlen($cleaned) === 10) {
            return '+63' . $cleaned;
        }

        // Default fallback (just prefix + if missing)
        return '+' . ltrim($cleaned, '0');
    }
}
