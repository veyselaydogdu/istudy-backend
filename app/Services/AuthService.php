<?php

namespace App\Services;

use App\Models\Base\Role;
use App\Models\Tenant\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    /**
     * Yeni kullanıcı ve tenant oluştur (Kayıt işlemi)
     */
    public function register(array $data): array
    {
        return DB::transaction(function () use ($data) {
            // Kullanıcı oluştur
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'], // Model'de hashed cast var
                'phone' => $data['phone'] ?? null,
            ]);

            // Tenant owner rolü ata
            $tenantOwnerRole = Role::where('name', 'tenant_owner')->first();
            if ($tenantOwnerRole) {
                $user->roles()->attach($tenantOwnerRole->id);
            }

            // Tenant oluştur
            $tenant = Tenant::create([
                'name' => $data['institution_name'],
                'owner_user_id' => $user->id,
                'country' => $data['country'] ?? 'TR',
                'currency' => $data['currency'] ?? 'TRY',
                'created_by' => $user->id,
            ]);

            // User'a tenant_id ata
            $user->update(['tenant_id' => $tenant->id]);

            // Sanctum token oluştur
            $token = $user->createToken('auth_token')->plainTextToken;

            return [
                'user' => $user->fresh()->load('roles'),
                'tenant' => $tenant,
                'token' => $token,
            ];
        });
    }

    /**
     * Giriş işlemi
     */
    public function login(array $credentials): array
    {
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw new \Exception('E-posta veya şifre hatalı.', 401);
        }

        // Son giriş tarihini güncelle
        $user->update(['last_login_at' => now()]);

        // Mevcut token'ları sil ve yeni oluştur
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user->load('roles'),
            'token' => $token,
        ];
    }

    /**
     * Çıkış işlemi
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }
}
