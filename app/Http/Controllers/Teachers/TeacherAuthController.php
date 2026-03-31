<?php

namespace App\Http\Controllers\Teachers;

use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * TeacherAuthController — Öğretmen Kimlik Doğrulama
 *
 * Öğretmenin kendi kullanıcı bilgilerine erişimi ve oturum kapatma.
 */
class TeacherAuthController extends BaseTeacherController
{
    public function __construct(
        private readonly AuthService $authService
    ) {}

    /**
     * Giriş yapmış öğretmenin bilgilerini döner (profil dahil)
     */
    public function me(): JsonResponse
    {
        try {
            $user = $this->user()->load(['roles', 'teacherProfiles.school']);

            return $this->successResponse(
                UserResource::make($user),
                'Kullanıcı bilgileri.'
            );
        } catch (\Throwable $e) {
            Log::error('TeacherAuthController::me Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse('Kullanıcı bilgileri alınamadı.', 500);
        }
    }

    /**
     * Oturumu kapat — mevcut token silinir
     */
    public function logout(): JsonResponse
    {
        try {
            $this->authService->logout($this->user());

            return $this->successResponse(null, 'Çıkış yapıldı.');
        } catch (\Throwable $e) {
            Log::error('TeacherAuthController::logout Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse('Çıkış yapılamadı.', 500);
        }
    }
}
