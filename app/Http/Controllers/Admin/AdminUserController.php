<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

/**
 * Admin Kullanıcı Yönetimi Controller
 *
 * Süper Admin tüm kullanıcıları listeleyebilir, arayabilir,
 * durumlarını değiştirebilir, rol atayabilir ve yeni kullanıcı oluşturabilir.
 */
class AdminUserController extends BaseController
{
    /**
     * Tüm kullanıcıları listele (filtreleme ve arama ile)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::query();

            // Arama
            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            // Rol filtresi
            if ($role = $request->input('role')) {
                $query->whereHas('roles', fn ($q) => $q->where('name', $role));
            }

            // Tenant filtresi
            if ($tenantId = $request->input('tenant_id')) {
                $query->where('tenant_id', $tenantId);
            }

            // Durum filtresi
            if ($request->has('trashed')) {
                $query->onlyTrashed();
            }

            // Sıralama
            $sortBy = $request->input('sort_by', 'created_at');
            $sortDir = $request->input('sort_dir', 'desc');
            $query->orderBy($sortBy, $sortDir);

            $perPage = $request->input('per_page', 15);
            $users = $query->with(['roles', 'teacherProfiles.school', 'familyProfiles'])
                ->paginate($perPage);

            return $this->paginatedResponse(
                UserResource::collection($users)
            );
        } catch (\Throwable $e) {
            Log::error('Admin kullanıcı listeleme hatası: '.$e->getMessage());

            return $this->errorResponse('Kullanıcılar listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Kullanıcı detayı
     */
    public function show(User $user): JsonResponse
    {
        try {
            $user->load([
                'roles',
                'teacherProfiles.school',
                'familyProfiles.children',
                'tenants',
            ]);

            // Kullanıcı ile ilgili ek istatistikler
            $stats = [
                'total_schools' => $user->teacherProfiles()->count(),
                'total_children' => $user->familyProfiles->sum(fn ($fp) => $fp->children->count()),
                'total_tenants' => $user->tenants()->count(),
                'last_login_at' => $user->last_login_at?->toISOString(),
            ];

            return $this->successResponse([
                'user' => new UserResource($user),
                'stats' => $stats,
            ]);
        } catch (\Throwable $e) {
            Log::error('Admin kullanıcı detay hatası: '.$e->getMessage());

            return $this->errorResponse('Kullanıcı detayı getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Yeni kullanıcı oluştur (admin tarafından)
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'tenant_id' => 'nullable|exists:tenants,id',
            'role' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'phone' => $request->phone,
                'tenant_id' => $request->tenant_id,
                'created_by' => $this->user()->id,
            ]);

            // Rol ata
            if ($request->role) {
                $role = \App\Models\Base\Role::where('name', $request->role)->first();
                if ($role) {
                    $user->roles()->attach($role->id);
                }
            }

            DB::commit();

            return $this->successResponse(
                new UserResource($user->load('roles')),
                'Kullanıcı başarıyla oluşturuldu.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin kullanıcı oluşturma hatası: '.$e->getMessage());

            return $this->errorResponse('Kullanıcı oluşturulurken bir hata oluştu.', 500);
        }
    }

    /**
     * Kullanıcı güncelle
     */
    public function update(Request $request, User $user): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => "sometimes|email|unique:users,email,{$user->id}",
                'phone' => 'nullable|string|max:20',
                'password' => 'nullable|string|min:8',
                'tenant_id' => 'nullable|exists:tenants,id',
            ]);

            $data = $request->only(['name', 'email', 'phone', 'tenant_id']);
            $data['updated_by'] = $this->user()->id;

            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->password);
            }

            $user->update($data);

            DB::commit();

            return $this->successResponse(
                new UserResource($user->fresh()->load('roles')),
                'Kullanıcı başarıyla güncellendi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin kullanıcı güncelleme hatası: '.$e->getMessage());

            return $this->errorResponse('Kullanıcı güncellenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Kullanıcıya rol ata
     */
    public function assignRole(Request $request, User $user): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'role' => 'required|string|exists:roles,name',
            ]);

            $role = \App\Models\Base\Role::where('name', $request->role)->firstOrFail();
            $user->roles()->syncWithoutDetaching([$role->id]);

            DB::commit();

            return $this->successResponse(
                new UserResource($user->fresh()->load('roles')),
                'Rol başarıyla atandı.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin rol atama hatası: '.$e->getMessage());

            return $this->errorResponse('Rol atanırken bir hata oluştu.', 500);
        }
    }

    /**
     * Kullanıcıdan rol kaldır
     */
    public function removeRole(Request $request, User $user): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'role' => 'required|string|exists:roles,name',
            ]);

            $role = \App\Models\Base\Role::where('name', $request->role)->firstOrFail();
            $user->roles()->detach($role->id);

            DB::commit();

            return $this->successResponse(
                new UserResource($user->fresh()->load('roles')),
                'Rol başarıyla kaldırıldı.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin rol kaldırma hatası: '.$e->getMessage());

            return $this->errorResponse('Rol kaldırılırken bir hata oluştu.', 500);
        }
    }

    /**
     * Kullanıcı sil (soft delete)
     */
    public function destroy(User $user): JsonResponse
    {
        DB::beginTransaction();
        try {
            if ($user->id === $this->user()->id) {
                return $this->errorResponse('Kendinizi silemezsiniz.', 422);
            }

            $user->delete();

            DB::commit();

            return $this->successResponse(null, 'Kullanıcı başarıyla silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin kullanıcı silme hatası: '.$e->getMessage());

            return $this->errorResponse('Kullanıcı silinirken bir hata oluştu.', 500);
        }
    }

    /**
     * Silinmiş kullanıcıyı geri yükle
     */
    public function restore(int $userId): JsonResponse
    {
        DB::beginTransaction();
        try {
            $user = User::onlyTrashed()->findOrFail($userId);
            $user->restore();

            DB::commit();

            return $this->successResponse(
                new UserResource($user),
                'Kullanıcı başarıyla geri yüklendi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin kullanıcı geri yükleme hatası: '.$e->getMessage());

            return $this->errorResponse('Kullanıcı geri yüklenirken bir hata oluştu.', 500);
        }
    }
}
