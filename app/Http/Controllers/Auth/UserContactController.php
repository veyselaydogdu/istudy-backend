<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Base\BaseController;
use App\Models\Base\UserContactNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * UserContactController — Kullanıcı Ek İletişim Numaraları
 *
 * Tüm kullanıcılar WhatsApp, Telegram, Signal vb. ek numaralar ekleyebilir.
 * Ülke kodu (country_id) ile uluslararası format desteği.
 */
class UserContactController extends BaseController
{
    /**
     * Numaralarımı listele
     */
    public function index(): JsonResponse
    {
        try {
            $contacts = UserContactNumber::byUser($this->user()->id)
                ->with('country:id,name,iso2,phone_code,flag_emoji')
                ->ordered()
                ->get();

            return $this->successResponse($contacts);
        } catch (\Throwable $e) {
            return $this->errorResponse('İletişim numaraları alınamadı.', 500);
        }
    }

    /**
     * Yeni numara ekle
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'country_id' => 'nullable|exists:countries,id',
                'type'       => 'required|string|in:' . implode(',', array_keys(UserContactNumber::TYPES)),
                'label'      => 'nullable|string|max:50',
                'phone_code' => 'required|string|max:10',
                'number'     => 'required|string|max:30',
                'is_primary' => 'nullable|boolean',
            ]);

            $validated['user_id'] = $this->user()->id;

            // Aynı tipte max 3 numara
            $count = UserContactNumber::byUser($this->user()->id)
                ->byType($validated['type'])
                ->count();

            if ($count >= 3) {
                return $this->errorResponse("Aynı tipte en fazla 3 numara ekleyebilirsiniz.", 422);
            }

            // Eğer primary yapılıyorsa, diğer primary'leri kaldır
            if (! empty($validated['is_primary'])) {
                UserContactNumber::byUser($this->user()->id)
                    ->primary()
                    ->update(['is_primary' => false]);
            }

            DB::beginTransaction();
            $contact = UserContactNumber::create($validated);
            DB::commit();

            return $this->successResponse($contact->load('country:id,name,iso2,phone_code,flag_emoji'), 'Numara eklendi.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Numara ekleme hatası', ['error' => $e->getMessage()]);

            return $this->errorResponse('Numara eklenemedi.', 500);
        }
    }

    /**
     * Numara güncelle
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $contact = UserContactNumber::where('user_id', $this->user()->id)->findOrFail($id);

            $validated = $request->validate([
                'country_id' => 'nullable|exists:countries,id',
                'type'       => 'sometimes|string|in:' . implode(',', array_keys(UserContactNumber::TYPES)),
                'label'      => 'nullable|string|max:50',
                'phone_code' => 'sometimes|string|max:10',
                'number'     => 'sometimes|string|max:30',
                'is_primary' => 'nullable|boolean',
            ]);

            // Primary değişikliği
            if (! empty($validated['is_primary'])) {
                UserContactNumber::byUser($this->user()->id)
                    ->where('id', '!=', $id)
                    ->primary()
                    ->update(['is_primary' => false]);
            }

            DB::beginTransaction();
            $contact->update($validated);
            DB::commit();

            return $this->successResponse($contact->fresh()->load('country:id,name,iso2,phone_code,flag_emoji'), 'Numara güncellendi.');
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse('Numara güncellenemedi.', 500);
        }
    }

    /**
     * Numara sil
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $contact = UserContactNumber::where('user_id', $this->user()->id)->findOrFail($id);

            DB::beginTransaction();
            $contact->delete();
            DB::commit();

            return $this->successResponse(null, 'Numara silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse('Numara silinemedi.', 500);
        }
    }

    /**
     * Mevcut iletişim türlerini listele
     */
    public function types(): JsonResponse
    {
        return $this->successResponse(UserContactNumber::TYPES);
    }
}
