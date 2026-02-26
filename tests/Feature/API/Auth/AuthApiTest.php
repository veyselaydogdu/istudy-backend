<?php

namespace Tests\Feature\API\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

/**
 * Auth API Testleri
 * Kapsam: POST /auth/register, POST /auth/login, POST /auth/logout, GET /auth/me
 */
class AuthApiTest extends TestCase
{
    use ApiTestHelpers, RefreshDatabase;

    // ─── REGISTER ────────────────────────────────────────────────

    /** @test */
    public function register_ile_gecerli_veri_girilince_kullanici_ve_tenant_olusur(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ali',
            'email' => 'ali@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'institution_name' => 'Test Okulu',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => ['user', 'tenant', 'token'],
            ])
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('users', ['email' => 'ali@example.com']);
        $this->assertDatabaseHas('tenants', ['name' => 'Test Okulu']);
    }

    /** @test */
    public function register_eksik_alan_ile_422_doner(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ali',
            'email' => 'ali@example.com',
            // password eksik
        ]);

        $response->assertStatus(422)
            ->assertJson(['success' => false]);
    }

    /** @test */
    public function register_zaten_kullanilmis_email_ile_422_doner(): void
    {
        User::factory()->create(['email' => 'exist@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Yeni Kullanıcı',
            'email' => 'exist@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'institution_name' => 'Test Kurum',
        ]);

        $response->assertStatus(422);
    }

    // ─── LOGIN ───────────────────────────────────────────────────

    /** @test */
    public function login_gecerli_bilgilerle_token_doner(): void
    {
        User::factory()->create([
            'email' => 'user@example.com',
            'password' => bcrypt('Password123!'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'user@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['user', 'token']])
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function login_yanlis_sifre_ile_401_doner(): void
    {
        User::factory()->create([
            'email' => 'user@example.com',
            'password' => bcrypt('DogruSifre'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'user@example.com',
            'password' => 'YanlisSifre',
        ]);

        $response->assertStatus(401)
            ->assertJson(['success' => false]);
    }

    /** @test */
    public function login_olmayan_email_ile_hata_doner(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'yok@example.com',
            'password' => 'herhangi',
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function login_eksik_alan_ile_422_doner(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'user@example.com',
            // password eksik
        ]);

        $response->assertStatus(422);
    }

    // ─── LOGOUT ──────────────────────────────────────────────────

    /** @test */
    public function logout_auth_ile_basarili_doner(): void
    {
        ['user' => $user] = $this->createAuthenticatedTenant();

        $response = $this->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function logout_token_olmadan_401_doner(): void
    {
        $response = $this->postJson('/api/auth/logout');

        $response->assertStatus(401);
    }

    // ─── ME ──────────────────────────────────────────────────────

    /** @test */
    public function me_auth_ile_kullanici_bilgilerini_doner(): void
    {
        ['user' => $user] = $this->createAuthenticatedTenant();

        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.email', $user->email);
    }

    /** @test */
    public function me_token_olmadan_401_doner(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }
}
