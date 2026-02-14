<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Models\School\Announcement;
use App\Models\School\SchoolEnrollmentRequest;
use App\Models\Notification\SystemNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Admin Sistem Yönetimi Controller
 *
 * Süper Admin sistem geneli işleyişi kontrol edebilir:
 * - Kayıt talepleri izleme
 * - Sistem bildirimleri gönderme
 * - Duyuru yönetimi
 * - Sistem ayarları
 * - Bakım modu
 */
class AdminSystemController extends BaseController
{
    /**
     * Tüm bekleyen kayıt taleplerini listele (sistem geneli)
     */
    public function pendingEnrollments(Request $request): JsonResponse
    {
        try {
            $query = SchoolEnrollmentRequest::where('status', 'pending')
                ->with(['school', 'user']);

            if ($schoolId = $request->input('school_id')) {
                $query->where('school_id', $schoolId);
            }

            $perPage = $request->input('per_page', 15);
            $requests = $query->latest()->paginate($perPage);

            return $this->paginatedResponse($requests);
        } catch (\Throwable $e) {
            Log::error('Admin bekleyen kayıt talepleri hatası: ' . $e->getMessage());

            return $this->errorResponse('Kayıt talepleri listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Tüm kayıt taleplerini listele (filtreli)
     */
    public function allEnrollments(Request $request): JsonResponse
    {
        try {
            $query = SchoolEnrollmentRequest::with(['school', 'user', 'reviewer']);

            if ($status = $request->input('status')) {
                $query->where('status', $status);
            }

            if ($schoolId = $request->input('school_id')) {
                $query->where('school_id', $schoolId);
            }

            $perPage = $request->input('per_page', 15);

            return $this->paginatedResponse(
                $query->latest()->paginate($perPage)
            );
        } catch (\Throwable $e) {
            Log::error('Admin kayıt talepleri hatası: ' . $e->getMessage());

            return $this->errorResponse('Kayıt talepleri listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Sistem geneli bildirim gönder
     */
    public function sendSystemNotification(Request $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'body' => 'required|string',
                'type' => 'required|string|in:general,maintenance,update,announcement',
                'priority' => 'nullable|string|in:low,normal,high,urgent',
                'target_roles' => 'nullable|array',
                'school_id' => 'nullable|exists:schools,id',
            ]);

            $notification = SystemNotification::create([
                'school_id' => $request->school_id,
                'type' => $request->type,
                'title' => $request->title,
                'body' => $request->body,
                'priority' => $request->priority ?? 'normal',
                'target_roles' => $request->target_roles,
                'sent_at' => now(),
                'created_by' => $this->user()->id,
            ]);

            DB::commit();

            return $this->successResponse($notification, 'Sistem bildirimi gönderildi.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin sistem bildirim hatası: ' . $e->getMessage());

            return $this->errorResponse('Bildirim gönderilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Tüm sistem bildirimlerini listele
     */
    public function notifications(Request $request): JsonResponse
    {
        try {
            $query = SystemNotification::latest();

            if ($type = $request->input('type')) {
                $query->where('type', $type);
            }

            if ($schoolId = $request->input('school_id')) {
                $query->where('school_id', $schoolId);
            }

            $perPage = $request->input('per_page', 15);

            return $this->paginatedResponse(
                $query->paginate($perPage)
            );
        } catch (\Throwable $e) {
            Log::error('Admin bildirimler hatası: ' . $e->getMessage());

            return $this->errorResponse('Bildirimler listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Tüm duyuruları listele (sistem geneli)
     */
    public function announcements(Request $request): JsonResponse
    {
        try {
            $query = Announcement::with(['school'])->latest();

            if ($schoolId = $request->input('school_id')) {
                $query->where('school_id', $schoolId);
            }

            if ($type = $request->input('type')) {
                $query->where('type', $type);
            }

            $perPage = $request->input('per_page', 15);

            return $this->paginatedResponse(
                $query->paginate($perPage)
            );
        } catch (\Throwable $e) {
            Log::error('Admin duyurular hatası: ' . $e->getMessage());

            return $this->errorResponse('Duyurular listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Sistem sağlık kontrolü (health check)
     */
    public function healthCheck(): JsonResponse
    {
        try {
            $checks = [
                'database' => $this->checkDatabase(),
                'cache' => $this->checkCache(),
                'queue' => $this->checkQueue(),
                'storage' => $this->checkStorage(),
                'timestamp' => now()->toISOString(),
            ];

            $allHealthy = collect($checks)->except('timestamp')
                ->every(fn ($check) => $check['status'] === 'ok');

            return $this->successResponse([
                'status' => $allHealthy ? 'healthy' : 'degraded',
                'checks' => $checks,
            ], $allHealthy ? 'Sistem sağlıklı.' : 'Sistem sorunlu.');
        } catch (\Throwable $e) {
            Log::error('Admin health check hatası: ' . $e->getMessage());

            return $this->errorResponse('Sağlık kontrolü sırasında bir hata oluştu.', 500);
        }
    }

    /**
     * Sistem ayarları
     */
    public function settings(): JsonResponse
    {
        try {
            $settings = [
                'app_name' => config('app.name'),
                'app_env' => config('app.env'),
                'app_debug' => config('app.debug'),
                'app_url' => config('app.url'),
                'timezone' => config('app.timezone'),
                'locale' => config('app.locale'),
                'php_version' => phpversion(),
                'laravel_version' => app()->version(),
                'db_driver' => config('database.default'),
                'cache_driver' => config('cache.default'),
                'queue_driver' => config('queue.default'),
                'mail_driver' => config('mail.default'),
            ];

            return $this->successResponse($settings, 'Sistem ayarları getirildi.');
        } catch (\Throwable $e) {
            Log::error('Admin sistem ayarları hatası: ' . $e->getMessage());

            return $this->errorResponse('Sistem ayarları getirilirken bir hata oluştu.', 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Private Helpers
    |--------------------------------------------------------------------------
    */

    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();

            return ['status' => 'ok', 'message' => 'Veritabanı bağlantısı aktif.'];
        } catch (\Throwable $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    private function checkCache(): array
    {
        try {
            cache()->put('health_check', true, 10);
            $value = cache()->get('health_check');

            return ['status' => $value ? 'ok' : 'error', 'message' => $value ? 'Cache aktif.' : 'Cache okunamadı.'];
        } catch (\Throwable $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    private function checkQueue(): array
    {
        try {
            $driver = config('queue.default');

            return ['status' => 'ok', 'message' => "Queue driver: {$driver}"];
        } catch (\Throwable $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    private function checkStorage(): array
    {
        try {
            $writable = is_writable(storage_path());

            return [
                'status' => $writable ? 'ok' : 'error',
                'message' => $writable ? 'Storage yazılabilir.' : 'Storage yazılamaz!',
                'free_space' => round(disk_free_space(storage_path()) / 1073741824, 2) . ' GB',
            ];
        } catch (\Throwable $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
}
