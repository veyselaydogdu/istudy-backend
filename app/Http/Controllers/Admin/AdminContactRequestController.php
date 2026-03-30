<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Models\ContactRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin İletişim Talepleri Controller
 *
 * Süper Adminlerin iletişim formlarını listelemesi, görüntülemesi,
 * durum güncellemesi ve not eklemesi.
 */
class AdminContactRequestController extends BaseController
{
    /**
     * Tüm talepleri listele (filtreli, sayfalı)
     */
    public function index(Request $request): JsonResponse
    {
        $query = ContactRequest::query()->with('repliedBy:id,name,email');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $query->orderBy('created_at', 'desc');

        $perPage = $request->integer('per_page', 15);
        $results = $query->paginate($perPage);

        return $this->paginatedResponse($results);
    }

    /**
     * Talebi detaylıca göster + okundu olarak işaretle
     */
    public function show(ContactRequest $contactRequest): JsonResponse
    {
        if ($contactRequest->status === 'pending') {
            $contactRequest->update(['status' => 'read']);
        }

        return $this->successResponse($contactRequest->load('repliedBy:id,name,email'));
    }

    /**
     * Durum güncelle (read / replied) ve opsiyonel not ekle
     */
    public function updateStatus(Request $request, ContactRequest $contactRequest): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,read,replied'],
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $data = ['status' => $validated['status']];

        if (isset($validated['admin_note'])) {
            $data['admin_note'] = $validated['admin_note'];
        }

        if ($validated['status'] === 'replied') {
            $data['replied_by'] = $this->user()?->id;
            $data['replied_at'] = now();
        }

        $contactRequest->update($data);

        return $this->successResponse(
            $contactRequest->fresh('repliedBy:id,name,email'),
            'Durum güncellendi.'
        );
    }

    /**
     * Talebi sil
     */
    public function destroy(ContactRequest $contactRequest): JsonResponse
    {
        $contactRequest->delete();

        return $this->successResponse(null, 'İletişim talebi silindi.');
    }

    /**
     * Özet istatistikler
     */
    public function stats(): JsonResponse
    {
        return $this->successResponse([
            'total' => ContactRequest::count(),
            'pending' => ContactRequest::where('status', 'pending')->count(),
            'read' => ContactRequest::where('status', 'read')->count(),
            'replied' => ContactRequest::where('status', 'replied')->count(),
        ]);
    }
}
