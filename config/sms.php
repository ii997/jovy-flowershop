<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default SMS Driver
    |--------------------------------------------------------------------------
    |
    | This option controls the default SMS gateway driver that will be used
    | to deliver SMS messages. Supported drivers: "httpsms", "textbee"
    |
    */

    'default' => env('SMS_DRIVER', 'textbee'),

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
    | SMS Gateways Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure the credentials and API parameters for each
    | SMS gateway provider supported by your application.
    |
    */

    'gateways' => [

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
