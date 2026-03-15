<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;

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
     * Şifre sıfırlama e-postası gönder
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        try {
            $status = Password::sendResetLink(['email' => $data['email']]);

            if ($status === Password::RESET_LINK_SENT) {
                return $this->successResponse(null, 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
            }

            return $this->errorResponse('E-posta adresi bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('AuthController::forgotPassword Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Şifre sıfırla
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'regex:/[^A-Za-z0-9]/',
            ],
        ], [
            'password.regex' => 'Şifre en az 1 büyük harf, 1 rakam ve 1 özel karakter içermelidir.',
        ]);

        try {
            $status = Password::reset($data, function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();
            });

            if ($status === Password::PASSWORD_RESET) {
                return $this->successResponse(null, 'Şifreniz başarıyla güncellendi.');
            }

            return $this->errorResponse('Geçersiz veya süresi dolmuş bağlantı.', 400);
        } catch (\Throwable $e) {
            Log::error('AuthController::resetPassword Error', [
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
