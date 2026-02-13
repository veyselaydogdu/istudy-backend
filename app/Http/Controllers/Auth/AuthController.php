<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class AuthController extends BaseController
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Yeni kullanıcı kaydı — Tenant otomatik oluşturulur
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->register($request->validated());

            return $this->successResponse([
                'user' => UserResource::make($result['user']),
                'tenant' => $result['tenant'],
                'token' => $result['token'],
            ], 'Hesap başarıyla oluşturuldu.', 201);
        } catch (\Throwable $e) {
            Log::error('AuthController::register Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Kullanıcı girişi — Sanctum token döner
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->login($request->validated());

            return $this->successResponse([
                'user' => UserResource::make($result['user']),
                'token' => $result['token'],
            ], 'Giriş başarılı.');
        } catch (\Throwable $e) {
            Log::error('AuthController::login Error', [
                'message' => $e->getMessage(),
            ]);

            $code = $e->getCode() === 401 ? 401 : 400;

            return $this->errorResponse($e->getMessage(), $code);
        }
    }

    /**
     * Kullanıcı çıkışı — Mevcut token silinir
     */
    public function logout(): JsonResponse
    {
        try {
            $this->authService->logout($this->user());

            return $this->successResponse(null, 'Çıkış yapıldı.');
        } catch (\Throwable $e) {
            Log::error('AuthController::logout Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Aktif kullanıcı bilgileri
     */
    public function me(): JsonResponse
    {
        try {
            $user = $this->user()->load(['roles', 'teacherProfiles', 'familyProfiles']);

            return $this->successResponse(
                UserResource::make($user),
                'Kullanıcı bilgileri.'
            );
        } catch (\Throwable $e) {
            Log::error('AuthController::me Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
