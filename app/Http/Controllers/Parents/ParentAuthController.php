<?php

namespace App\Http\Controllers\Parents;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Parent\RegisterParentRequest;
use App\Http\Resources\UserResource;
use App\Models\Base\Role;
use App\Models\Base\UserRole;
use App\Models\Child\FamilyMember;
use App\Models\Child\FamilyProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;

class ParentAuthController extends BaseController
{
    /**
     * Veli kaydı — User + FamilyProfile + FamilyMember oluşturur
     */
    public function register(RegisterParentRequest $request): JsonResponse
    {
        try {
            $result = DB::transaction(function () use ($request) {
                $data = $request->validated();

                $user = User::create([
                    'role_id' => UserRole::PARENT,
                    'name' => $data['name'],
                    'surname' => $data['surname'],
                    'email' => mb_strtolower($data['email']),
                    'password' => Hash::make($data['password']),
                    'phone' => $data['phone'] ?? null,
                    'tenant_id' => null,
                ]);

                // Parent rolü ata
                $parentRole = Role::where('name', 'parent')->first();
                if ($parentRole) {
                    $user->roles()->attach($parentRole->id);
                }

                // FamilyProfile oluştur
                $familyProfile = FamilyProfile::withoutGlobalScope('tenant')->create([
                    'owner_user_id' => $user->id,
                    'family_name' => mb_convert_case($data['surname'], MB_CASE_TITLE, 'UTF-8').' Family',
                    'created_by' => $user->id,
                ]);

                // FamilyMember kaydı (super_parent)
                FamilyMember::withoutGlobalScope('tenant')->create([
                    'family_profile_id' => $familyProfile->id,
                    'user_id' => $user->id,
                    'relation_type' => 'owner',
                    'role' => 'super_parent',
                    'is_active' => true,
                    'accepted_at' => now(),
                    'created_by' => $user->id,
                ]);

                // L-2: Token scope — parent yalnızca parent endpoint'lerine erişebilir
                $token = $user->createToken('parent-mobile', ['role:parent'])->plainTextToken;

                return ['user' => $user, 'token' => $token];
            });

            return $this->successResponse([
                'user' => UserResource::make($result['user']),
                'token' => $result['token'],
                'email_verified' => false,
            ], 'Hesap başarıyla oluşturuldu.', 201);
        } catch (\Throwable $e) {
            Log::error('ParentAuthController::register Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Veli girişi
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $credentials = $request->only('email', 'password');

            if (! Auth::attempt($credentials)) {
                return $this->errorResponse('E-posta veya şifre hatalı.', 401);
            }

            /** @var User $user */
            $user = Auth::user();

            // Yalnızca parent rolüne sahip kullanıcılar veli girişi yapabilir
            if ($user->role_id !== UserRole::PARENT) {
                Auth::logout();

                return $this->errorResponse('Bu hesap veli hesabı değil.', 401);
            }

            $user->update(['last_login_at' => now()]);

            // L-2: Token scope — parent yalnızca parent endpoint'lerine erişebilir
            $token = $user->createToken('parent-mobile', ['role:parent'])->plainTextToken;

            return $this->successResponse([
                'user' => UserResource::make($user),
                'token' => $token,
                'email_verified' => ! is_null($user->email_verified_at),
            ], 'Giriş başarılı.');
        } catch (\Throwable $e) {
            Log::error('ParentAuthController::login Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Çıkış
     */
    public function logout(): JsonResponse
    {
        try {
            $this->user()->currentAccessToken()->delete();

            return $this->successResponse(null, 'Çıkış yapıldı.');
        } catch (\Throwable $e) {
            Log::error('ParentAuthController::logout Error', [
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
            $user = $this->user()->load(['roles']);

            return $this->successResponse(
                UserResource::make($user),
                'Kullanıcı bilgileri.'
            );
        } catch (\Throwable $e) {
            Log::error('ParentAuthController::me Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Şifre sıfırlama linki gönder
     *
     * H-7: E-posta enumeration saldırısını önlemek için hesap varlığından bağımsız
     * olarak her zaman aynı başarı mesajı döndürülür.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        try {
            // Hesap var mı yok mu fark etmeksizin aynı yanıt döner (enumeration önlemi)
            Password::sendResetLink(['email' => $request->email]);

            return $this->successResponse(null, 'Hesap kayıtlıysa şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
        } catch (\Throwable $e) {
            Log::error('ParentAuthController::forgotPassword Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse('İşlem sırasında hata oluştu.', 500);
        }
    }

    /**
     * Şifre sıfırlama
     *
     * H-3: Güçlü şifre kuralları — AuthController ile aynı seviyede.
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

                $user->tokens()->delete();
            });

            if ($status === Password::PASSWORD_RESET) {
                return $this->successResponse(null, 'Şifreniz başarıyla güncellendi.');
            }

            return $this->errorResponse('Şifre sıfırlama başarısız. Token geçersiz veya süresi dolmuş.', 400);
        } catch (\Throwable $e) {
            Log::error('ParentAuthController::resetPassword Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * E-posta doğrulama
     */
    public function verifyEmail(Request $request, int $id, string $hash): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            if (! hash_equals(sha1($user->email), $hash)) {
                return $this->errorResponse('Geçersiz doğrulama bağlantısı.', 400);
            }

            if ($user->hasVerifiedEmail()) {
                return $this->successResponse(null, 'E-posta adresi zaten doğrulanmış.');
            }

            $user->markEmailAsVerified();

            return $this->successResponse(null, 'E-posta adresiniz başarıyla doğrulandı.');
        } catch (\Throwable $e) {
            Log::error('ParentAuthController::verifyEmail Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Doğrulama e-postasını tekrar gönder
     */
    public function resendVerification(): JsonResponse
    {
        try {
            $user = $this->user();

            if ($user->hasVerifiedEmail()) {
                return $this->successResponse(null, 'E-posta adresi zaten doğrulanmış.');
            }

            $user->sendEmailVerificationNotification();

            return $this->successResponse(null, 'Doğrulama e-postası gönderildi.');
        } catch (\Throwable $e) {
            Log::error('ParentAuthController::resendVerification Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
