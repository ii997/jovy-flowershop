<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default SMS Driver
    |--------------------------------------------------------------------------
    |
    | This option controls the default SMS gateway driver that will be used
    | to deliver SMS messages. Supported drivers: "android_gateway", "semaphore", "textbee", "httpsms", "log", "null"
    |
    */

    'default' => env('SMS_DRIVER', 'android_gateway'),

    /*
    |--------------------------------------------------------------------------
    | SMS Sender Name Header
    |--------------------------------------------------------------------------
    |
    | The prefix/header included in SMS notification messages.
    |
    */

    'sender_name' => env('SMS_SENDER_NAME', "Jovy's Flowershop"),

    /*
    |--------------------------------------------------------------------------
    | SMS Test Mode
    |--------------------------------------------------------------------------
    |
    | When enabled (e.g. "testing", "log", "enabled", true), SMS dispatch will
    | bypass remote gateway HTTP calls and write message details directly to
    | Laravel logs (storage/logs/laravel.log) and database sms_logs table.
    |
    */

    'test_mode' => env('SMS_TEST_MODE', false),

    /*
    |--------------------------------------------------------------------------
    | Default SMS Queue Name
    |--------------------------------------------------------------------------
    |
    | The name of the queue that SMS jobs will be dispatched to by default.
    |
    */

    'queue' => env('SMS_QUEUE', 'sms'),

    /*
    |--------------------------------------------------------------------------
    | SSL Verification Control
    |--------------------------------------------------------------------------
    */

    'verify_ssl' => env('SMS_VERIFY_SSL', true),

    /*
    |--------------------------------------------------------------------------
    | SMS Gateways Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure the credentials and API parameters for each
    | SMS gateway provider supported by your application.
    |
    */

    'gateways' => [

        'android_gateway' => [
            'endpoint' => env('ANDROID_GATEWAY_ENDPOINT', 'https://api.sms-gate.app/3rdparty/v1/message'),
            'token' => env('ANDROID_GATEWAY_TOKEN'),
            'login' => env('ANDROID_GATEWAY_LOGIN'),
            'password' => env('ANDROID_GATEWAY_PASSWORD'),
            'sim_number' => env('ANDROID_GATEWAY_SIM_NUMBER', 1),
        ],

        'semaphore' => [
            'key' => env('SEMAPHORE_API_KEY'),
            'sender_name' => env('SEMAPHORE_SENDER_NAME'),
            'endpoint' => env('SEMAPHORE_ENDPOINT', 'https://api.semaphore.co/api/v4/messages'),
        ],

        'httpsms' => [
            'key' => env('HTTPSMS_API_KEY'),
            'from' => env('HTTPSMS_FROM_NUMBER'),
            'endpoint' => env('HTTPSMS_ENDPOINT', 'https://api.httpsms.com/v1/messages/send'),
        ],

        'textbee' => [
            'key' => env('TEXTBEE_API_KEY'),
            'device_id' => env('TEXTBEE_DEVICE_ID'),
            'endpoint' => env('TEXTBEE_ENDPOINT', 'https://api.textbee.dev/api/v1/gateway/devices'),
        ],

    ],

];
