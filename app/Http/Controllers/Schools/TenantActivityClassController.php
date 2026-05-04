<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Models\Academic\SchoolClass;
use App\Models\ActivityClass\ActivityClass;
use App\Models\ActivityClass\ActivityClassEnrollment;
use App\Models\ActivityClass\ActivityClassGalleryItem;
use App\Models\ActivityClass\ActivityClassInvoice;
use App\Models\ActivityClass\ActivityClassMaterial;
use App\Models\Child\Child;
use App\Services\ActivityClassInvoiceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

/**
 * Tenant geneli etkinlik sınıfı işlemleri.
 * Okul seçimi opsiyonel — school_id null ise tüm tenant okullarında geçerli.
 */
class TenantActivityClassController extends BaseController
{
    public function index(): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;

            $query = ActivityClass::where('tenant_id', $tenantId)
                ->with(['schoolClasses:id,name', 'teachers.user:id,name,surname'])
                ->withCount(['activeEnrollments']);

            if ($schoolId = request('school_id')) {
                $query->where(function ($q) use ($schoolId) {
                    $q->where('school_id', $schoolId)->orWhereNull('school_id');
                });
            }

            if (request()->boolean('active_only')) {
                $query->where('is_active', true);
            }

            $data = $query->latest()->paginate(request('per_page', 15));

            return $this->paginatedResponse(\App\Http\Resources\ActivityClass\ActivityClassResource::collection($data));
        } catch (\Throwable $e) {
            Log::error('TenantActivityClassController::index', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'language' => 'nullable|string|max:10',
            'age_min' => 'nullable|integer|min:0|max:18',
            'age_max' => 'nullable|integer|min:0|max:18|gte:age_min',
            'capacity' => 'nullable|integer|min:1',
            'school_id' => 'nullable|integer|exists:schools,id',
            'is_school_wide' => 'boolean',
            'is_active' => 'boolean',
            'is_paid' => 'boolean',
            'price' => 'nullable|numeric|min:0|required_if:is_paid,true',
            'currency' => 'nullable|string|max:3',
            'invoice_required' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'schedule' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
            'is_global' => 'boolean',
            'school_class_ids' => 'nullable|array',
            'school_class_ids.*' => 'nullable',
        ]);

        $isGlobal = (bool) ($validated['is_global'] ?? false);

        if (! $isGlobal && ! ($validated['is_school_wide'] ?? true) && empty($validated['school_class_ids'])) {
            return $this->errorResponse('Belirli sınıflar seçildiğinde en az bir sınıf belirtilmelidir.', 422);
        }

        try {
            DB::beginTransaction();

            $activityClass = ActivityClass::create(array_merge($validated, [
                'tenant_id' => $this->user()->tenant_id,
                'school_id' => $isGlobal ? null : ($validated['school_id'] ?? null),
                'is_global' => $isGlobal,
            ]));

            // Global etkinlik sınıflarında sınıf ataması yapılmaz
            if (! $isGlobal && ! ($validated['is_school_wide'] ?? true) && ! empty($validated['school_class_ids'])) {
                $activityClass->schoolClasses()->sync($this->resolveClassIds($validated['school_class_ids']));
            }

            $activityClass->load(['schoolClasses:id,name', 'teachers.user:id,name,surname']);

            DB::commit();

            return $this->successResponse(
                \App\Http\Resources\ActivityClass\ActivityClassResource::make($activityClass),
                'Etkinlik sınıfı başarıyla oluşturuldu.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('TenantActivityClassController::store', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function show(ActivityClass $activityClass): JsonResponse
    {
        try {
            $this->authorizeOwnership($activityClass);

            $activityClass->load([
                'schoolClasses:id,name',
                'teachers.user:id,name,surname',
                'materials',
                'activeEnrollments.child',
            ]);

            return $this->successResponse(\App\Http\Resources\ActivityClass\ActivityClassResource::make($activityClass));
        } catch (\Throwable $e) {
            Log::error('TenantActivityClassController::show', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function update(Request $request, ActivityClass $activityClass): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'language' => 'nullable|string|max:10',
            'age_min' => 'nullable|integer|min:0|max:18',
            'age_max' => 'nullable|integer|min:0|max:18|gte:age_min',
            'capacity' => 'nullable|integer|min:1',
            'school_id' => 'nullable|integer|exists:schools,id',
            'is_school_wide' => 'boolean',
            'is_global' => 'boolean',
            'is_active' => 'boolean',
            'is_paid' => 'boolean',
            'price' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'invoice_required' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'schedule' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
            'school_class_ids' => 'nullable|array',
            'school_class_ids.*' => 'nullable',
        ]);

        $isGlobal = $validated['is_global'] ?? $activityClass->is_global;
        $isSchoolWide = $validated['is_school_wide'] ?? $activityClass->is_school_wide;

        if (! $isGlobal && ! $isSchoolWide && array_key_exists('school_class_ids', $validated) && empty($validated['school_class_ids'])) {
            return $this->errorResponse('Belirli sınıflar seçildiğinde en az bir sınıf belirtilmelidir.', 422);
        }

        try {
            DB::beginTransaction();

            $this->authorizeOwnership($activityClass);

            $isGlobal = $validated['is_global'] ?? $activityClass->is_global;
            if ($isGlobal) {
                $validated['school_id'] = null;
            }

            $activityClass->update($validated);

            if (array_key_exists('school_class_ids', $validated)) {
                if ($isGlobal || ($validated['is_school_wide'] ?? $activityClass->is_school_wide)) {
                    $activityClass->schoolClasses()->detach();
                } else {
                    $activityClass->schoolClasses()->sync($this->resolveClassIds($validated['school_class_ids'] ?? []));
                }
            }

            $activityClass->load(['schoolClasses:id,name', 'teachers.user:id,name,surname']);
            DB::commit();

            return $this->successResponse(
                \App\Http\Resources\ActivityClass\ActivityClassResource::make($activityClass),
                'Etkinlik sınıfı güncellendi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('TenantActivityClassController::update', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function destroy(ActivityClass $activityClass): JsonResponse
    {
        try {
            $this->authorizeOwnership($activityClass);
            DB::beginTransaction();
            $activityClass->delete();
            DB::commit();

            return $this->successResponse(null, 'Etkinlik sınıfı silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('TenantActivityClassController::destroy', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    // ── Kayıtlar ──────────────────────────────────────────────────────────────

    public function enrollmentIndex(int $activity_class_id): JsonResponse
    {
        try {
            $activityClass = $this->findOwned($activity_class_id);
            $enrollments = ActivityClassEnrollment::where('activity_class_id', $activityClass->id)
                ->with(['child', 'invoice'])
                ->latest()
                ->paginate(request('per_page', 20));

            return $this->paginatedResponse(\App\Http\Resources\ActivityClass\ActivityClassEnrollmentResource::collection($enrollments));
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function enrollmentStore(Request $request, int $activity_class_id): JsonResponse
    {
        $request->validate([
            'child_id' => 'required|string',
            'notes' => 'nullable|string',
            'generate_invoice' => 'boolean',
            'invoice_required' => 'boolean',
            'due_date' => 'nullable|date',
        ]);

        try {
            DB::beginTransaction();
            $activityClass = $this->findOwned($activity_class_id);
            $child = is_numeric($request->child_id)
                ? Child::findOrFail($request->child_id)
                : Child::where('ulid', $request->child_id)->firstOrFail();

            $existing = ActivityClassEnrollment::where('activity_class_id', $activityClass->id)
                ->where('child_id', $child->id)->whereNull('deleted_at')->first();
            if ($existing) {
                return $this->errorResponse("{$child->full_name} zaten bu etkinlik sınıfına kayıtlı.", 422);
            }

            // Daha önce iptal edilmiş (soft-deleted) kayıt varsa unique constraint çakışmasını önlemek için sil
            ActivityClassEnrollment::withTrashed()
                ->where('activity_class_id', $activityClass->id)
                ->where('child_id', $child->id)
                ->whereNotNull('deleted_at')
                ->forceDelete();

            if ($activityClass->age_min !== null || $activityClass->age_max !== null) {
                $age = Carbon::parse($child->birth_date)->age;
                if ($activityClass->age_min !== null && $age < $activityClass->age_min) {
                    return $this->errorResponse("{$child->full_name} minimum yaş sınırının ({$activityClass->age_min}) altındadır.", 422);
                }
                if ($activityClass->age_max !== null && $age > $activityClass->age_max) {
                    return $this->errorResponse("{$child->full_name} maksimum yaş sınırını ({$activityClass->age_max}) aşmaktadır.", 422);
                }
            }

            if ($activityClass->capacity !== null) {
                $count = ActivityClassEnrollment::where('activity_class_id', $activityClass->id)->where('status', 'active')->count();
                if ($count >= $activityClass->capacity) {
                    return $this->errorResponse('Etkinlik sınıfının kapasitesi dolu.', 422);
                }
            }

            $enrollment = ActivityClassEnrollment::create([
                'activity_class_id' => $activityClass->id,
                'child_id' => $child->id,
                'family_profile_id' => $child->family_profile_id,
                'status' => 'active',
                'enrolled_by' => 'tenant',
                'enrolled_by_user_id' => $this->user()->id,
                'enrolled_at' => now(),
                'notes' => $request->notes,
            ]);

            if ($activityClass->is_paid && $request->boolean('generate_invoice', true)) {
                (new ActivityClassInvoiceService)->createForEnrollment(
                    $enrollment,
                    $activityClass,
                    $this->user()->id,
                    $request->due_date,
                    $request->boolean('invoice_required', $activityClass->invoice_required)
                );
            }

            $enrollment->load(['child', 'invoice']);
            DB::commit();

            return $this->successResponse(
                \App\Http\Resources\ActivityClass\ActivityClassEnrollmentResource::make($enrollment),
                "{$child->full_name} etkinlik sınıfına kaydedildi.",
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function enrollmentDestroy(Request $request, int $activity_class_id, int $enrollment_id): JsonResponse
    {
        try {
            DB::beginTransaction();
            $enrollment = ActivityClassEnrollment::where('activity_class_id', $activity_class_id)
                ->findOrFail($enrollment_id);

            $billingResult = (new ActivityClassInvoiceService)->handleEnrollmentCancellation(
                $enrollment->id,
                $request->input('refund_reason')
            );

            $enrollment->update(['status' => 'cancelled', 'cancelled_at' => now()]);
            $enrollment->delete();
            DB::commit();

            return $this->successResponse(
                ['refunded' => $billingResult['refunded']],
                $billingResult['refunded'] ? 'Kayıt iptal edildi ve iade faturası oluşturuldu.' : 'Kayıt iptal edildi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    // ── Öğretmenler ───────────────────────────────────────────────────────────

    public function teacherStore(Request $request, int $activity_class_id): JsonResponse
    {
        $request->validate([
            'teacher_profile_id' => 'required|integer|exists:teacher_profiles,id',
            'role' => 'nullable|string|max:100',
        ]);

        try {
            DB::beginTransaction();
            $activityClass = $this->findOwned($activity_class_id);

            if ($activityClass->teachers()->where('teacher_profile_id', $request->teacher_profile_id)->exists()) {
                return $this->errorResponse('Bu öğretmen zaten atanmış.', 422);
            }

            $activityClass->teachers()->attach($request->teacher_profile_id, ['role' => $request->role]);
            $activityClass->load(['teachers.user:id,name,surname']);
            DB::commit();

            return $this->successResponse(
                $activityClass->teachers->map(fn ($t) => ['id' => $t->id, 'name' => $t->user->name.' '.$t->user->surname, 'role' => $t->pivot->role]),
                'Öğretmen atandı.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function teacherDestroy(int $activity_class_id, int $teacher_profile_id): JsonResponse
    {
        try {
            DB::beginTransaction();
            $activityClass = $this->findOwned($activity_class_id);
            $activityClass->teachers()->detach($teacher_profile_id);
            DB::commit();

            return $this->successResponse(null, 'Öğretmen ataması kaldırıldı.');
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    // ── Materyaller ───────────────────────────────────────────────────────────

    public function materialStore(Request $request, int $activity_class_id): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'quantity' => 'nullable|string|max:100',
            'is_required' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        try {
            $activityClass = $this->findOwned($activity_class_id);
            $material = $activityClass->materials()->create($request->only(['name', 'description', 'quantity', 'is_required', 'sort_order']));

            return $this->successResponse($material, 'Materyal eklendi.', 201);
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function materialUpdate(Request $request, int $activity_class_id, ActivityClassMaterial $material): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'quantity' => 'nullable|string|max:100',
            'is_required' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        try {
            $material->update($request->only(['name', 'description', 'quantity', 'is_required', 'sort_order']));

            return $this->successResponse($material, 'Materyal güncellendi.');
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function materialDestroy(int $activity_class_id, ActivityClassMaterial $material): JsonResponse
    {
        try {
            $material->delete();

            return $this->successResponse(null, 'Materyal silindi.');
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    // ── Galeri ────────────────────────────────────────────────────────────────

    public function galleryIndex(int $activity_class_id): JsonResponse
    {
        try {
            $activityClass = $this->findOwned($activity_class_id);
            $items = $activityClass->gallery()->get()->map(fn ($item) => $this->formatGalleryItem($item));

            return $this->successResponse($items);
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function galleryStore(Request $request, int $activity_class_id): JsonResponse
    {
        $request->validate([
            'image' => 'required|file|mimes:jpg,jpeg,png,webp|max:10240',
            'caption' => 'nullable|string|max:255',
            'sort_order' => 'integer|min:0',
        ]);

        try {
            $activityClass = $this->findOwned($activity_class_id);
            $file = $request->file('image');
            $tenantId = $this->user()->tenant_id;
            $path = $file->store("tenants/{$tenantId}/activity-classes/{$activityClass->id}/gallery", 'local');

            $item = $activityClass->gallery()->create([
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'caption' => $request->caption,
                'sort_order' => $request->sort_order ?? 0,
                'uploaded_by' => $this->user()->id,
            ]);

            return $this->successResponse($this->formatGalleryItem($item), 'Fotoğraf yüklendi.', 201);
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function galleryDestroy(int $activity_class_id, ActivityClassGalleryItem $galleryItem): JsonResponse
    {
        try {
            Storage::disk('local')->delete($galleryItem->file_path);
            $galleryItem->delete();

            return $this->successResponse(null, 'Fotoğraf silindi.');
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    // ── Faturalar ─────────────────────────────────────────────────────────────

    public function invoiceIndex(int $activity_class_id): JsonResponse
    {
        try {
            $activityClass = $this->findOwned($activity_class_id);
            $invoices = ActivityClassInvoice::where('activity_class_id', $activityClass->id)
                ->with(['child:id,first_name,last_name', 'familyProfile.owner:id,name,surname'])
                ->latest()
                ->paginate(request('per_page', 20));

            return $this->paginatedResponse(\App\Http\Resources\ActivityClass\ActivityClassInvoiceResource::collection($invoices));
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function invoiceMarkPaid(Request $request, int $activity_class_id, ActivityClassInvoice $invoice): JsonResponse
    {
        $request->validate(['payment_method' => 'nullable|string|max:100', 'notes' => 'nullable|string']);

        try {
            DB::beginTransaction();
            $invoice->update(['status' => 'paid', 'paid_at' => now(), 'payment_method' => $request->payment_method, 'notes' => $request->notes ?? $invoice->notes]);
            DB::commit();

            return $this->successResponse($invoice, 'Fatura ödendi olarak işaretlendi.');
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function invoiceCancel(int $activity_class_id, ActivityClassInvoice $invoice): JsonResponse
    {
        try {
            DB::beginTransaction();
            $invoice->update(['status' => 'cancelled']);
            DB::commit();

            return $this->successResponse(null, 'Fatura iptal edildi.');
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function authorizeOwnership(ActivityClass $activityClass): void
    {
        if ($activityClass->tenant_id !== $this->user()->tenant_id) {
            abort(403, 'Bu etkinlik sınıfına erişim yetkiniz yok.');
        }
    }

    private function findOwned(int $id): ActivityClass
    {
        $ac = ActivityClass::findOrFail($id);
        $this->authorizeOwnership($ac);

        return $ac;
    }

    private function formatGalleryItem(ActivityClassGalleryItem $item): array
    {
        return [
            'id' => $item->id,
            'caption' => $item->caption,
            'sort_order' => $item->sort_order,
            'original_name' => $item->original_name,
            'mime_type' => $item->mime_type,
            'file_size' => $item->file_size,
            'url' => URL::signedRoute('activity-class-gallery.serve', ['galleryItem' => $item->id], now()->addHours(2)),
            'created_at' => $item->created_at,
        ];
    }

    /**
     * ULID veya integer class ID listesini integer PK listesine çevirir.
     *
     * @param  array<int|string>  $rawIds
     * @return array<int>
     */
    private function resolveClassIds(array $rawIds): array
    {
        $ulids = array_filter($rawIds, fn ($id) => ! is_numeric($id));
        $integers = array_values(array_filter($rawIds, fn ($id) => is_numeric($id)));

        if (! empty($ulids)) {
            $resolved = SchoolClass::whereIn('ulid', $ulids)->pluck('id')->toArray();
            $integers = array_merge($integers, $resolved);
        }

        return array_map('intval', $integers);
    }
}
