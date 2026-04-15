<?php

namespace App\Http\Controllers\Teachers;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\UserResource;
use App\Models\Base\Role;
use App\Models\Base\UserRole;
use App\Models\School\TeacherProfile;
use App\Models\School\TeacherTenantMembership;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;

/**
 * TeacherAuthController — Öğretmen Kayıt / Giriş / Profil
 *
 * Öğretmenler artık kendileri kayıt olur; tenant'lardan bağımsız hesap sahibidir.
 */
class TeacherAuthController extends BaseController
{
    /**
     * Öğretmen kaydı — User + TeacherProfile oluşturur
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'surname' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8|confirmed',
            'phone' => 'required|string|max:20',
        ]);

        try {
            $result = DB::transaction(function () use ($request) {
                $user = User::create([
                    'role_id' => UserRole::TEACHER,
                    'name' => $request->name,
                    'surname' => $request->surname,
                    'email' => mb_strtolower($request->email),
                    'password' => Hash::make($request->password),
                    'phone' => $request->phone,
                    'tenant_id' => null,
                    'is_active' => true,
                ]);

                $teacherRole = Role::where('name', 'teacher')->first();
                if ($teacherRole) {
                    $user->roles()->attach($teacherRole->id);
                }

                $profile = TeacherProfile::create([
                    'user_id' => $user->id,
                    'tenant_id' => null,
                    'title' => $request->title,
                    'specialization' => $request->specialization,
                    'experience_years' => $request->experience_years ?? 0,
                    'employment_type' => 'full_time',
                    'created_by' => $user->id,
                ]);

                // L-2: Token scope — teacher yalnızca teacher endpoint'lerine erişebilir
                $token = $user->createToken('teacher-mobile', ['role:teacher'])->plainTextToken;

                return ['user' => $user->load('roles'), 'token' => $token, 'profile' => $profile];
            });

            return $this->successResponse([
                'user' => UserResource::make($result['user']),
                'token' => $result['token'],
                'teacher_profile_id' => $result['profile']->id,
            ], 'Hesap başarıyla oluşturuldu.', 201);
        } catch (\Throwable $e) {
            Log::error('TeacherAuthController::register', ['message' => $e->getMessage()]);

            return $this->errorResponse('Kayıt sırasında hata oluştu.', 500);
        }
    }

    /**
     * Öğretmen girişi — aktif membership listesiyle döner
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        try {
            $user = User::where('email', $request->email)->with('roles')->first();

            if (! $user || ! Hash::check($request->password, $user->password)) {
                return $this->errorResponse('E-posta veya şifre hatalı.', 401);
            }

            // Yalnızca teacher rolüne sahip kullanıcılar öğretmen girişi yapabilir
            if ($user->role_id !== UserRole::TEACHER) {
                return $this->errorResponse('Bu hesap öğretmen hesabı değil.', 401);
            }

            if (isset($user->is_active) && ! $user->is_active) {
                return $this->errorResponse('Hesabınız devre dışı bırakılmıştır. Lütfen yöneticinizle iletişime geçin.', 401);
            }

            $profile = TeacherProfile::where('user_id', $user->id)->first();

            $user->tokens()->delete();
            // L-2: Token scope — teacher yalnızca teacher endpoint'lerine erişebilir
            $token = $user->createToken('teacher-mobile', ['role:teacher'])->plainTextToken;
            $user->update(['last_login_at' => now()]);

            $memberships = [];
            if ($profile) {
                $memberships = TeacherTenantMembership::where('teacher_profile_id', $profile->id)
                    ->where('status', 'active')
                    ->with(['tenant' => fn ($q) => $q->with('schools:id,name,tenant_id')])
                    ->get()
                    ->map(fn ($m) => [
                        'membership_id' => $m->id,
                        'tenant_id' => $m->tenant_id,
                        'tenant_name' => $m->tenant?->name,
                        'schools' => $m->tenant?->schools->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])->values() ?? [],
                        'joined_at' => $m->joined_at?->toISOString(),
                    ]);
            }

            return $this->successResponse([
                'user' => UserResource::make($user),
                'token' => $token,
                'teacher_profile' => $profile ? [
                    'id' => $profile->id,
                    'title' => $profile->title,
                    'specialization' => $profile->specialization,
                    'profile_photo' => $profile->profile_photo,
                ] : null,
                'active_memberships' => $memberships,
            ], 'Giriş başarılı.');
        } catch (\Throwable $e) {
            Log::error('TeacherAuthController::login', ['message' => $e->getMessage()]);

            return $this->errorResponse('Giriş sırasında hata oluştu.', 500);
        }
    }

    /**
     * Giriş yapmış öğretmenin tam profili
     */
    public function me(): JsonResponse
    {
        try {
            $user = $this->user()->load('roles');
            $profile = TeacherProfile::where('user_id', $user->id)
                ->with(['country', 'educations', 'approvedCertificates', 'approvedCourses', 'skills'])
                ->first();

            $activeMemberships = [];
            $pendingInvitations = [];

            if ($profile) {
                $activeMemberships = TeacherTenantMembership::where('teacher_profile_id', $profile->id)
                    ->whereIn('status', ['active', 'inactive'])
                    ->with(['tenant' => fn ($q) => $q->with('schools:id,name,tenant_id')])
                    ->get()
                    ->map(fn ($m) => [
                        'membership_id' => $m->id,
                        'tenant_id' => $m->tenant_id,
                        'tenant_name' => $m->tenant?->name,
                        'status' => $m->status,
                        'schools' => $m->tenant?->schools->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])->values() ?? [],
                        'joined_at' => $m->joined_at?->toISOString(),
                    ]);

                $pendingInvitations = TeacherTenantMembership::where('teacher_profile_id', $profile->id)
                    ->where('status', 'pending')
                    ->where('invite_type', 'tenant_invite')
                    ->with('tenant:id,name', 'invitedBy:id,name,surname')
                    ->get()
                    ->map(fn ($m) => [
                        'id' => $m->id,
                        'tenant_id' => $m->tenant_id,
                        'tenant_name' => $m->tenant?->name,
                        'invited_by' => $m->invitedBy ? "{$m->invitedBy->name} {$m->invitedBy->surname}" : null,
                        'invited_at' => $m->created_at?->toISOString(),
                    ]);
            }

            return $this->successResponse([
                'user' => UserResource::make($user),
                'teacher_profile' => $profile,
                'active_memberships' => $activeMemberships,
                'pending_invitations' => $pendingInvitations,
            ], 'Profil getirildi.');
        } catch (\Throwable $e) {
            Log::error('TeacherAuthController::me', ['message' => $e->getMessage()]);

            return $this->errorResponse('Profil alınamadı.', 500);
        }
    }

    /**
     * Çıkış
     */
    public function logout(): JsonResponse
    {
        $this->user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Çıkış yapıldı.');
    }

    /**
     * Şifre sıfırlama isteği gönder
     *
     * H-7: E-posta enumeration saldırısını önlemek için hesap varlığından bağımsız
     * olarak her zaman aynı başarı mesajı döndürülür.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        // Hesap var mı yok mu fark etmeksizin aynı yanıt döner (enumeration önlemi)
        Password::sendResetLink(['email' => $request->email]);

        return $this->successResponse(null, 'Hesap kayıtlıysa şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    }

    /**
     * Şifre sıfırla
     *
     * H-3: Güçlü şifre kuralları — AuthController ile aynı seviyede.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
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

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return $this->successResponse(null, 'Şifre başarıyla sıfırlandı.');
        }

        return $this->errorResponse('Geçersiz veya süresi dolmuş token.', 422);
    }
}
