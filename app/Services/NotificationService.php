<?php

namespace App\Services;

use App\Jobs\SendStatusUpdateSMS;
use App\Models\Notification;
use App\Models\SmsLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use libphonenumber\NumberParseException;
use libphonenumber\PhoneNumberFormat;
use libphonenumber\PhoneNumberUtil;

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
        if ($sendSms && ! empty($customPhone) && $orderId) {
            SendStatusUpdateSMS::dispatch($orderId, $type, $customPhone)
                ->onQueue(config('sms.queue', 'sms'));
        }

        return $notification;
    }

    /**
     * Directly send an SMS payload via configured default gateway with fallback to secondary gateways.
     * Returns true on success, false on failure. Logs all attempts in database.
     */
    public static function sendSmsDirect(
        string $toPhone,
        string $content,
        ?int $orderId = null,
        int $attempts = 1
    ): bool {
        $formattedTo = self::formatPhoneNumber($toPhone);
        $primaryDriver = config('sms.default', 'android_gateway');
        $testMode = config('sms.test_mode', false);

        $isTestMode = in_array(strtolower((string) $testMode), ['testing', 'log', 'enabled', 'true', '1'], true)
            || $testMode === true
            || $primaryDriver === 'log';

        if ($isTestMode) {
            SmsLog::create([
                'phone_number' => $formattedTo,
                'message' => $content,
                'gateway' => 'log',
                'status' => 'sent',
                'attempts' => $attempts,
                'order_id' => $orderId,
            ]);
            Log::info("[TEST SMS LOG] To: {$formattedTo} | Content: {$content} | Order: #JFS-{$orderId} (Attempt {$attempts})");

            return true;
        }

        if ($primaryDriver === 'null') {
            Log::debug("[NULL SMS DRIVER] SMS skipped for {$formattedTo}");

            return true;
        }

        $fallbackOrder = match ($primaryDriver) {
            'httpsms' => ['httpsms', 'textbee', 'android_gateway', 'semaphore'],
            'android_gateway' => ['android_gateway', 'textbee', 'httpsms', 'semaphore'],
            'semaphore' => ['semaphore', 'android_gateway', 'textbee', 'httpsms'],
            default => ['textbee', 'httpsms', 'android_gateway', 'semaphore'],
        };

        $drivers = array_values(array_unique(array_filter(array_merge([$primaryDriver], $fallbackOrder))));

        foreach ($drivers as $gateway) {
            $method = match ($gateway) {
                'android_gateway' => 'sendViaAndroidGateway',
                'semaphore' => 'sendViaSemaphore',
                'textbee' => 'sendViaTextBee',
                'httpsms' => 'sendViaHttpSms',
                default => null,
            };

            if (! $method || ! method_exists(self::class, $method)) {
                continue;
            }

            if (self::$method($formattedTo, $content)) {
                SmsLog::create([
                    'phone_number' => $formattedTo,
                    'message' => $content,
                    'gateway' => $gateway,
                    'status' => 'sent',
                    'attempts' => $attempts,
                    'order_id' => $orderId,
                ]);
                Log::info("SMS successfully delivered to {$formattedTo} via {$gateway} (Order #JFS-{$orderId}, attempt {$attempts}).");

                return true;
            }

            Log::warning("SMS gateway ({$gateway}) failed for {$formattedTo}. Trying next available fallback.");
        }

        // Log database SMS log if all gateways failed
        SmsLog::create([
            'phone_number' => $formattedTo,
            'message' => $content,
            'gateway' => 'none',
            'status' => 'failed',
            'attempts' => $attempts,
            'error_details' => 'All configured SMS gateways failed to deliver message.',
            'order_id' => $orderId,
        ]);

        Log::error("All SMS gateways failed to deliver message to {$formattedTo} (Order #JFS-{$orderId}, attempt {$attempts}).");

        return false;
    }

    /**
     * Send SMS via Android SMS Gateway (Cloud Mode with Token or Local/Tunnel Mode with Basic Auth).
     */
    protected static function sendViaAndroidGateway(string $formattedTo, string $content): bool
    {
        $endpoint = config('sms.gateways.android_gateway.endpoint', 'https://api.sms-gate.app/3rdparty/v1/message');
        $token = config('sms.gateways.android_gateway.token');
        $login = config('sms.gateways.android_gateway.login');
        $password = config('sms.gateways.android_gateway.password');
        $simNumber = config('sms.gateways.android_gateway.sim_number', 1);

        $hasToken = ! empty($token);
        $hasBasicAuth = ! empty($login) && ! empty($password);

        if (! $hasToken && ! $hasBasicAuth) {
            Log::warning('Android SMS Gateway credentials missing. Cannot send SMS.');

            return false;
        }

        try {
            $request = Http::asJson()->acceptJson()->timeout(10);

            if ($hasToken) {
                $request->withToken($token);
            } else {
                $request->withBasicAuth($login, $password);
            }

            if (! config('sms.verify_ssl', true) || app()->environment('local', 'testing')) {
                $request->withoutVerifying();
            }

            $payload = [
                'message' => $content,
                'phoneNumbers' => [$formattedTo],
            ];

            if (! empty($simNumber)) {
                $payload['simNumber'] = (int) $simNumber;
            }

            $response = $request->post($endpoint, $payload);

            if ($response->successful()) {
                return true;
            }

            $errorMsg = $response->json('message') ?? $response->body() ?? 'Unknown response error';
            Log::warning("Android SMS Gateway API Response Status Code {$response->status()}: {$errorMsg}");

            return false;
        } catch (\Exception $e) {
            Log::error('Android SMS Gateway Connection failed: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Send SMS via Semaphore REST API.
     */
    protected static function sendViaSemaphore(string $formattedTo, string $content): bool
    {
        $apiKey = config('sms.gateways.semaphore.key');
        $senderName = config('sms.gateways.semaphore.sender_name');
        $endpoint = config('sms.gateways.semaphore.endpoint', 'https://api.semaphore.co/api/v4/messages');

        if (empty($apiKey)) {
            Log::warning('Semaphore credentials missing. Cannot send SMS.');

            return false;
        }

        try {
            $request = Http::asJson()->acceptJson()->timeout(10);

            if (! config('sms.verify_ssl', true) || app()->environment('local', 'testing')) {
                $request->withoutVerifying();
            }

            $payload = [
                'apikey' => $apiKey,
                'number' => $formattedTo,
                'message' => $content,
            ];

            if (! empty($senderName)) {
                $payload['sendername'] = $senderName;
            }

            $response = $request->post($endpoint, $payload);

            if ($response->successful()) {
                return true;
            }

            $errorMsg = $response->json('message') ?? $response->body() ?? 'Unknown response error';
            Log::warning("Semaphore API Response Status Code {$response->status()}: {$errorMsg}");

            return false;
        } catch (\Exception $e) {
            Log::error('Semaphore Connection failed: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Send SMS via httpSMS REST API.
     */
    protected static function sendViaHttpSms(string $formattedTo, string $content): bool
    {
        $apiKey = config('sms.gateways.httpsms.key') ?: config('services.httpsms.key');
        $fromPhone = config('sms.gateways.httpsms.from') ?: config('services.httpsms.from');

        if (empty($fromPhone)) {
            $settingsPath = storage_path('app/settings.json');
            if (file_exists($settingsPath)) {
                $settings = json_decode(file_get_contents($settingsPath), true);
                $fromPhone = $settings['phone'] ?? null;
            }
        }

        $formattedFrom = $fromPhone ? self::formatPhoneNumber($fromPhone) : null;

        if (empty($apiKey) || empty($formattedFrom)) {
            Log::warning('httpSMS credentials missing. Cannot send SMS via httpSMS.');

            return false;
        }

        try {
            $endpoint = config('sms.gateways.httpsms.endpoint', 'https://api.httpsms.com/v1/messages/send');
            $request = Http::withHeaders([
                'x-api-key' => $apiKey,
                'Accept' => 'application/json',
            ])->timeout(10);

            if (! config('sms.verify_ssl', true) || app()->environment('local', 'testing')) {
                $request->withoutVerifying();
            }

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
            Log::error('httpSMS Connection failed: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Send SMS via TextBee REST API.
     */
    protected static function sendViaTextBee(string $formattedTo, string $content): bool
    {
        $apiKey = config('sms.gateways.textbee.key') ?: config('services.textbee.key');
        $deviceId = config('sms.gateways.textbee.device_id') ?: config('services.textbee.device_id');

        if (empty($apiKey) || empty($deviceId)) {
            Log::warning('TextBee credentials missing. Cannot send SMS via TextBee.');

            return false;
        }

        try {
            $endpoint = "https://api.textbee.dev/api/v1/gateway/devices/{$deviceId}/send-sms";
            $request = Http::withHeaders([
                'x-api-key' => $apiKey,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->timeout(10);

            if (! config('sms.verify_ssl', true) || app()->environment('local', 'testing')) {
                $request->withoutVerifying();
            }

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
            Log::error('TextBee Connection failed: '.$e->getMessage());

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
            Log::debug("libphonenumber failed to parse phone '{$phone}': ".$e->getMessage());
        }

        $cleaned = preg_replace('/[^0-9+]/', '', $phone);

        if (str_starts_with($cleaned, '+')) {
            return $cleaned;
        }

        if (str_starts_with($cleaned, '09') && strlen($cleaned) === 11) {
            return '+63'.substr($cleaned, 1);
        }

        if (str_starts_with($cleaned, '9') && strlen($cleaned) === 10) {
            return '+63'.$cleaned;
        }

        return '+'.ltrim($cleaned, '0');
    }
}
