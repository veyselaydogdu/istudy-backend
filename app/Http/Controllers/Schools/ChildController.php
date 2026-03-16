<?php

namespace App\Http\Controllers\Schools;

use App\Http\Requests\Child\StoreChildRequest;
use App\Http\Requests\Child\UpdateChildRequest;
use App\Http\Resources\ChildResource;
use App\Models\Academic\SchoolClass;
use App\Models\Child\Child;
use App\Services\ChildService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ChildController extends BaseSchoolController
{
    public function __construct(protected ChildService $service)
    {
        parent::__construct();
    }

    /**
     * Öğrencileri listele
     */
    public function index(): JsonResponse
    {
        try {
            $this->authorize('viewAny', Child::class);

            $schoolId = (int) request()->route('school_id');

            $query = Child::query()
                ->where('school_id', $schoolId)
                ->with([
                    'familyProfile' => fn ($q) => $q->withoutGlobalScope('tenant')->with('owner'),
                ]);

            $perPage = request('per_page', 15);
            $data = $query->latest()->paginate($perPage);

            return $this->paginatedResponse(ChildResource::collection($data));

        } catch (\Throwable $e) {
            Log::error('ChildController::index Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Yeni öğrenci oluştur
     */
    public function store(StoreChildRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('create', Child::class);

            // Pasif sınıfa kayıt yapılamaz
            if ($request->class_id) {
                $class = SchoolClass::find($request->class_id);
                if ($class && ! $class->is_active) {
                    return $this->errorResponse('Pasif sınıfa öğrenci kaydı yapılamaz.', 422);
                }
            }

            $child = $this->service->create($request->validated());

            DB::commit();

            return $this->successResponse(
                ChildResource::make($child),
                'Öğrenci başarıyla oluşturuldu.',
                201
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ChildController::store Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Öğrenci detayını getir
     */
    public function show(int $school_id, Child $child): JsonResponse
    {
        try {
            $this->authorize('view', $child);

            $child->load([
                'familyProfile' => fn ($q) => $q->withoutGlobalScope('tenant')->with([
                    'owner',
                    'members.user',
                ]),
                'classes',
                'allergens' => fn ($q) => $q->withoutGlobalScope('tenant'),
                'medications' => fn ($q) => $q->withoutGlobalScope('tenant'),
                'conditions' => fn ($q) => $q->withoutGlobalScope('tenant'),
                'nationality',
            ]);

            return $this->successResponse(ChildResource::make($child));

        } catch (\Throwable $e) {
            Log::error('ChildController::show Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Öğrenci güncelle
     */
    public function update(UpdateChildRequest $request, int $school_id, Child $child): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('update', $child);

            $updatedChild = $this->service->update($child, $request->validated());

            DB::commit();

            return $this->successResponse(
                ChildResource::make($updatedChild),
                'Öğrenci başarıyla güncellendi.'
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ChildController::update Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Öğrenci sil
     */
    public function destroy(int $school_id, Child $child): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('delete', $child);

            $this->service->delete($child);

            DB::commit();

            return $this->successResponse(null, 'Öğrenci başarıyla silindi.');

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ChildController::destroy Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }
}
