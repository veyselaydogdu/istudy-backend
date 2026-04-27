<?php

namespace Tests\Feature;

use App\Models\Base\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/**
 * Private medya rotaları güvenlik testleri.
 * Tüm private serve endpoint'leri hem auth:sanctum hem signed middleware gerektirir.
 */
class MediaSecurityTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────────────────────────────────
    // HandlesMediaStorage Trait varlık testleri
    // ─────────────────────────────────────────────────────────────────────────

    public function test_handles_media_storage_trait_exists(): void
    {
        $this->assertTrue(trait_exists(\App\Traits\HandlesMediaStorage::class));
    }

    public function test_parent_child_controller_uses_trait(): void
    {
        $traits = class_uses_recursive(\App\Http\Controllers\Parents\ParentChildController::class);
        $this->assertContains(\App\Traits\HandlesMediaStorage::class, $traits);
    }

    public function test_parent_auth_controller_uses_trait(): void
    {
        $traits = class_uses_recursive(\App\Http\Controllers\Parents\ParentAuthController::class);
        $this->assertContains(\App\Traits\HandlesMediaStorage::class, $traits);
    }

    public function test_teacher_blog_controller_uses_trait(): void
    {
        $traits = class_uses_recursive(\App\Http\Controllers\Teachers\TeacherBlogController::class);
        $this->assertContains(\App\Traits\HandlesMediaStorage::class, $traits);
    }

    public function test_teacher_pickup_controller_uses_trait(): void
    {
        $traits = class_uses_recursive(\App\Http\Controllers\Teachers\TeacherPickupController::class);
        $this->assertContains(\App\Traits\HandlesMediaStorage::class, $traits);
    }

    public function test_activity_class_gallery_controller_uses_trait(): void
    {
        $traits = class_uses_recursive(\App\Http\Controllers\Schools\ActivityClassGalleryController::class);
        $this->assertContains(\App\Traits\HandlesMediaStorage::class, $traits);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Çocuk profil fotoğrafı — auth:sanctum + signed zorunlu
    // ─────────────────────────────────────────────────────────────────────────

    public function test_child_photo_unauthenticated_returns_401(): void
    {
        $response = $this->getJson('/api/parent/children/fake-ulid/photo');
        $this->assertContains($response->status(), [401, 403]);
    }

    public function test_child_photo_auth_without_signature_returns_403(): void
    {
        $parent = User::factory()->create(['role_id' => UserRole::PARENT, 'tenant_id' => null]);
        $response = $this->actingAs($parent, 'sanctum')
            ->getJson('/api/parent/children/fake-ulid/photo');
        $this->assertContains($response->status(), [401, 403]);
    }

    public function test_child_photo_signed_without_auth_returns_401(): void
    {
        $signedUrl = URL::signedRoute('parent.child.photo', ['child' => 'fake-ulid'], now()->addMinutes(30));
        $path = parse_url($signedUrl, PHP_URL_PATH).'?'.parse_url($signedUrl, PHP_URL_QUERY);
        $response = $this->getJson($path);
        $this->assertContains($response->status(), [401, 403]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Veli profil fotoğrafı — auth:sanctum + signed zorunlu
    // ─────────────────────────────────────────────────────────────────────────

    public function test_parent_profile_photo_unauthenticated_returns_401(): void
    {
        $response = $this->getJson('/api/parent/profile/photo/1');
        $this->assertContains($response->status(), [401, 403]);
    }

    public function test_parent_profile_photo_signed_without_auth_returns_401(): void
    {
        $signedUrl = URL::signedRoute('parent.profile.photo', ['user' => 1], now()->addMinutes(30));
        $path = parse_url($signedUrl, PHP_URL_PATH).'?'.parse_url($signedUrl, PHP_URL_QUERY);
        $response = $this->getJson($path);
        $this->assertContains($response->status(), [401, 403]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Sosyal medya — auth:sanctum + signed zorunlu
    // ─────────────────────────────────────────────────────────────────────────

    public function test_social_media_serve_unauthenticated_returns_401(): void
    {
        $response = $this->getJson('/api/social-media/1/serve');
        $this->assertContains($response->status(), [401, 403]);
    }

    public function test_social_media_signed_without_auth_returns_401(): void
    {
        $signedUrl = URL::signedRoute('social-media.serve', ['media' => 1], now()->addHours(2));
        $path = parse_url($signedUrl, PHP_URL_PATH).'?'.parse_url($signedUrl, PHP_URL_QUERY);
        $response = $this->getJson($path);
        $this->assertContains($response->status(), [401, 403]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Pickup log fotoğrafı — auth:sanctum + signed zorunlu
    // ─────────────────────────────────────────────────────────────────────────

    public function test_pickup_photo_unauthenticated_returns_401(): void
    {
        $response = $this->getJson('/api/teacher/pickup-logs/1/photo');
        $this->assertContains($response->status(), [401, 403]);
    }

    public function test_pickup_photo_signed_without_auth_returns_401(): void
    {
        $signedUrl = URL::signedRoute('teacher.pickup.photo', ['log' => 1], now()->addMinutes(60));
        $path = parse_url($signedUrl, PHP_URL_PATH).'?'.parse_url($signedUrl, PHP_URL_QUERY);
        $response = $this->getJson($path);
        $this->assertContains($response->status(), [401, 403]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Galeri — auth:sanctum + signed zorunlu
    // ─────────────────────────────────────────────────────────────────────────

    public function test_activity_class_gallery_unauthenticated_returns_401(): void
    {
        $response = $this->getJson('/api/activity-class-gallery/1/serve');
        $this->assertContains($response->status(), [401, 403]);
    }

    public function test_activity_gallery_unauthenticated_returns_401(): void
    {
        $response = $this->getJson('/api/activity-gallery/1/serve');
        $this->assertContains($response->status(), [401, 403]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Öğretmen blog görseli — auth:sanctum + signed zorunlu
    // ─────────────────────────────────────────────────────────────────────────

    public function test_teacher_blog_image_unauthenticated_returns_401(): void
    {
        $response = $this->getJson('/api/teacher/blogs/1/image');
        $this->assertContains($response->status(), [401, 403]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Sınıf logosu — auth:sanctum + signed zorunlu
    // ─────────────────────────────────────────────────────────────────────────

    public function test_class_logo_unauthenticated_returns_401(): void
    {
        $response = $this->getJson('/api/class-logo/1');
        $this->assertContains($response->status(), [401, 403]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Yemek fotoğrafı — auth:sanctum + signed zorunlu
    // ─────────────────────────────────────────────────────────────────────────

    public function test_meal_photo_unauthenticated_returns_401(): void
    {
        $response = $this->getJson('/api/meal-photo/1');
        $this->assertContains($response->status(), [401, 403]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Öğretmen belge sunumu — auth:sanctum + signed zorunlu
    // ─────────────────────────────────────────────────────────────────────────

    public function test_teacher_document_unauthenticated_returns_401(): void
    {
        $response = $this->getJson('/api/teacher/profile/educations/1/document');
        $this->assertContains($response->status(), [401, 403]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Signed URL formatı — imza parametresi içermeli
    // ─────────────────────────────────────────────────────────────────────────

    public function test_pickup_photo_signed_url_contains_signature(): void
    {
        $url = URL::signedRoute('teacher.pickup.photo', ['log' => 42], now()->addMinutes(60));
        $this->assertStringContainsString('signature=', $url);
        $this->assertStringContainsString('teacher/pickup-logs/42/photo', $url);
    }

    public function test_child_photo_signed_url_contains_signature(): void
    {
        $url = URL::signedRoute('parent.child.photo', ['child' => 'test-ulid'], now()->addMinutes(30));
        $this->assertStringContainsString('signature=', $url);
        $this->assertStringContainsString('parent/children/test-ulid/photo', $url);
    }

    public function test_parent_profile_photo_signed_url_contains_signature(): void
    {
        $url = URL::signedRoute('parent.profile.photo', ['user' => 1], now()->addMinutes(30));
        $this->assertStringContainsString('signature=', $url);
        $this->assertStringContainsString('parent/profile/photo/1', $url);
    }
}
