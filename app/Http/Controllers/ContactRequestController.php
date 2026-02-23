<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\StoreContactRequestRequest;
use App\Models\ContactRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

/**
 * Herkese Açık İletişim Formu Controller
 *
 * Ziyaretçiler iletişim formu gönderir.
 * Kayıt sonrası tüm süper adminlere veritabanı bildirimi gönderilir.
 */
class ContactRequestController extends BaseController
{
    public function store(StoreContactRequestRequest $request): JsonResponse
    {
        $contactRequest = ContactRequest::create([
            'name' => $request->name,
            'email' => $request->email,
            'subject' => $request->subject,
            'message' => $request->message,
            'ip_address' => $request->ip(),
        ]);

        // Tüm süper adminlere bildirim gönder
        $superAdmins = User::whereHas(
            'roles',
            fn ($q) => $q->where('name', 'super_admin')
        )->get();

        foreach ($superAdmins as $admin) {
            $admin->notifications()->create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'type' => 'App\Notifications\ContactRequestReceived',
                'notifiable_type' => User::class,
                'notifiable_id' => $admin->id,
                'data' => json_encode([
                    'title' => 'Yeni İletişim Talebi',
                    'body' => "{$contactRequest->name} ({$contactRequest->email}) yeni bir iletişim formu gönderdi: {$contactRequest->subject}",
                    'type' => 'contact_request',
                    'contact_request_id' => $contactRequest->id,
                ]),
            ]);
        }

        return $this->successResponse(
            ['id' => $contactRequest->id],
            'Mesajınız başarıyla gönderildi. En kısa sürede dönüş yapacağız.',
            201
        );
    }
}
