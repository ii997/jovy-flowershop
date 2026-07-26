<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\SmsLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use libphonenumber\PhoneNumberUtil;
use libphonenumber\PhoneNumberFormat;
use libphonenumber\NumberParseException;

class NotificationService
{
    /**
     * Send in-app and optionally dispatch SMS notifications via queue.
     */
    public static function send(
        ?int $userId,
        string $title,
        string $message,
        string $type,
        bool $isAdmin = false,
        bool $sendSms = false,
        ?string $customPhone = null,
        ?int $orderId = null
    ): Notification {
        // 1. Persist in-app notification in the database
        $notification = Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'is_admin' => $isAdmin,
        ]);

        // 2. Dispatch SMS via SendStatusUpdateSMS job if requested
        if ($sendSms && !empty($customPhone) && $orderId) {
            \App\Jobs\SendStatusUpdateSMS::dispatch($orderId, $type, $customPhone)
                ->onQueue(config('sms.queue', 'sms'));
        }

        return $notification;
    }

    /**
     * Directly send an SMS payload via configured default gateway with fallback to secondary gateway.
     * Returns true on success, false on failure. Logs all attempts in database.
     */
    public static function sendSmsDirect(
        string $toPhone,
        string $content,
        ?int $orderId = null,
        int $attempts = 1
    ): bool {
        $formattedTo = self::formatPhoneNumber($toPhone);
        $primaryDriver = config('sms.default', 'httpsms');

        $isTextBeePrimary = ($primaryDriver === 'textbee');
        $primaryMethod = $isTextBeePrimary ? 'sendViaTextBee' : 'sendViaHttpSms';
        $secondaryMethod = $isTextBeePrimary ? 'sendViaHttpSms' : 'sendViaTextBee';
        $primaryGatewayName = $isTextBeePrimary ? 'textbee' : 'httpsms';
        $secondaryGatewayName = $isTextBeePrimary ? 'httpsms' : 'textbee';

        // 1. Attempt Primary Gateway
        if (self::$primaryMethod($formattedTo, $content)) {
            SmsLog::create([
                'phone_number' => $formattedTo,
                'message' => $content,
                'gateway' => $primaryGatewayName,
                'status' => 'sent',
                'attempts' => $attempts,
                'order_id' => $orderId,
            ]);
            Log::info("SMS successfully delivered to {$formattedTo} via {$primaryGatewayName} (Order #JFS-{$orderId}, attempt {$attempts}).");
            return true;
        }

        Log::warning("Primary SMS gateway ({$primaryGatewayName}) failed. Attempting fallback via {$secondaryGatewayName} for {$formattedTo}.");

        // 2. Attempt Fallback Gateway
        if (self::$secondaryMethod($formattedTo, $content)) {
            SmsLog::create([
                'phone_number' => $formattedTo,
                'message' => $content,
                'gateway' => $secondaryGatewayName,
                'status' => 'sent',
                'attempts' => $attempts,
                'order_id' => $orderId,
            ]);
            Log::info("SMS successfully delivered to {$formattedTo} via {$secondaryGatewayName} fallback (Order #JFS-{$orderId}, attempt {$attempts}).");
            return true;
        }

        // 3. Log database SMS log if both gateways failed
        SmsLog::create([
            'phone_number' => $formattedTo,
            'message' => $content,
            'gateway' => 'none',
            'status' => 'failed',
            'attempts' => $attempts,
            'error_details' => 'Both httpSMS and TextBee SMS gateways failed to deliver message.',
            'order_id' => $orderId,
        ]);

        Log::error("All SMS gateways failed to deliver message to {$formattedTo} (Order #JFS-{$orderId}, attempt {$attempts}).");
        return false;
    }

    /**
     * Send SMS via httpSMS REST API.
     */
    protected static function sendViaHttpSms(string $formattedTo, string $content): bool
    {
        $apiKey = config('sms.gateways.httpsms.key') ?? config('services.httpsms.key');
        $fromPhone = config('sms.gateways.httpsms.from') ?? config('services.httpsms.from');

        if (empty($fromPhone)) {
            $settingsPath = storage_path('app/settings.json');
            if (file_exists($settingsPath)) {
                $settings = json_decode(file_get_contents($settingsPath), true);
                $fromPhone = $settings['phone'] ?? null;
            }
        }

        $formattedFrom = $fromPhone ? self::formatPhoneNumber($fromPhone) : null;

        if (empty($apiKey) || empty($formattedFrom)) {
            Log::warning("httpSMS credentials missing. Cannot send SMS via httpSMS.");
            return false;
        }

        try {
            $endpoint = config('sms.gateways.httpsms.endpoint', 'https://api.httpsms.com/v1/messages/send');
            $request = Http::withHeaders([
                'x-api-key' => $apiKey,
                'Accept' => 'application/json',
            ])->timeout(10);

            $response = $request->post($endpoint, [
                'content' => $content,
                'from' => $formattedFrom,
                'to' => $formattedTo,
            ]);

            if ($response->successful()) {
                return true;
            }

            $errorMsg = $response->json('message') ?? $response->body() ?? 'Unknown response error';
            Log::warning("httpSMS API Response Status Code {$response->status()}: {$errorMsg}");
            return false;
        } catch (\Exception $e) {
            Log::error("httpSMS Connection failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send SMS via TextBee REST API.
     */
    protected static function sendViaTextBee(string $formattedTo, string $content): bool
    {
        $apiKey = config('sms.gateways.textbee.key') ?? config('services.textbee.key');
        $deviceId = config('sms.gateways.textbee.device_id') ?? config('services.textbee.device_id');

        if (empty($apiKey) || empty($deviceId)) {
            Log::warning("TextBee credentials missing. Cannot send SMS via TextBee.");
            return false;
        }

        try {
            $endpoint = "https://api.textbee.dev/api/v1/gateway/devices/{$deviceId}/send-sms";
            $request = Http::withHeaders([
                'x-api-key' => $apiKey,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->timeout(10);

            $response = $request->post($endpoint, [
                'recipients' => [$formattedTo],
                'message' => $content,
            ]);

            if ($response->successful()) {
                return true;
            }

            $errorMsg = $response->json('message') ?? $response->body() ?? 'Unknown response error';
            Log::warning("TextBee API Response Status Code {$response->status()}: {$errorMsg}");
            return false;
        } catch (\Exception $e) {
            Log::error("TextBee Connection failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Format a phone number to strict E.164 international format (+63...) for SMS gateways.
     */
    public static function formatPhoneNumber(string $phone): string
    {
        try {
            $phoneUtil = PhoneNumberUtil::getInstance();
            $parsedNumber = $phoneUtil->parse($phone, 'PH');
            if ($phoneUtil->isValidNumber($parsedNumber)) {
                return $phoneUtil->format($parsedNumber, PhoneNumberFormat::E164);
            }
        } catch (NumberParseException $e) {
            Log::debug("libphonenumber failed to parse phone '{$phone}': " . $e->getMessage());
        }

        $cleaned = preg_replace('/[^0-9+]/', '', $phone);

        if (str_starts_with($cleaned, '+')) {
            return $cleaned;
        }

        if (str_starts_with($cleaned, '09') && strlen($cleaned) === 11) {
            return '+63' . substr($cleaned, 1);
        }

        if (str_starts_with($cleaned, '9') && strlen($cleaned) === 10) {
            return '+63' . $cleaned;
        }

        return '+' . ltrim($cleaned, '0');
    }
}
