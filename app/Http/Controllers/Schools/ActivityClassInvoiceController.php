<?php

namespace App\Http\Controllers\Schools;

use App\Models\ActivityClass\ActivityClass;
use App\Models\ActivityClass\ActivityClassInvoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ActivityClassInvoiceController extends BaseSchoolController
{
    public function index(int $school_id, int $activity_class_id): JsonResponse
    {
        try {
            $activityClass = ActivityClass::where('school_id', $school_id)->findOrFail($activity_class_id);

            $invoices = ActivityClassInvoice::where('activity_class_id', $activityClass->id)
                ->with(['child:id,first_name,last_name', 'familyProfile.owner:id,name,surname'])
                ->latest()
                ->paginate(request('per_page', 20));

            return $this->paginatedResponse(\App\Http\Resources\ActivityClass\ActivityClassInvoiceResource::collection($invoices));
        } catch (\Throwable $e) {
            Log::error('ActivityClassInvoiceController::index', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function markPaid(Request $request, int $school_id, int $activity_class_id, ActivityClassInvoice $invoice): JsonResponse
    {
        $request->validate([
            'payment_method' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $invoice->update([
                'status' => 'paid',
                'paid_at' => now(),
                'payment_method' => $request->payment_method,
                'notes' => $request->notes ?? $invoice->notes,
            ]);

            DB::commit();

            return $this->successResponse($invoice, 'Fatura ödendi olarak işaretlendi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ActivityClassInvoiceController::markPaid', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function cancel(int $school_id, int $activity_class_id, ActivityClassInvoice $invoice): JsonResponse
    {
        try {
            DB::beginTransaction();
            $invoice->update(['status' => 'cancelled']);
            DB::commit();

            return $this->successResponse(null, 'Fatura iptal edildi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ActivityClassInvoiceController::cancel', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }
}
