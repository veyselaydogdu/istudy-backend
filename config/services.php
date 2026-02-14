<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Sanal POS Ayarları
    |--------------------------------------------------------------------------
    | Ödeme işlemleri için sanal POS konfigürasyonu.
    | Desteklenen ağ geçitleri: paytr, iyzico, param, stripe
    */
    'virtual_pos' => [
        'default_gateway' => env('VPOS_DEFAULT_GATEWAY', 'paytr'),
        'merchant_id'     => env('VPOS_MERCHANT_ID', ''),
        'merchant_key'    => env('VPOS_MERCHANT_KEY', ''),
        'merchant_salt'   => env('VPOS_MERCHANT_SALT', ''),
        'payment_url'     => env('VPOS_PAYMENT_URL', ''),
        'success_url'     => env('VPOS_SUCCESS_URL', ''),
        'fail_url'        => env('VPOS_FAIL_URL', ''),
        'callback_url'    => env('VPOS_CALLBACK_URL', ''),
        'test_mode'       => env('VPOS_TEST_MODE', true),
    ],

];
