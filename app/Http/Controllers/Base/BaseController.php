<?php

namespace App\Http\Controllers\Base;

use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller as BaseLaravelController;

abstract class BaseController extends BaseLaravelController
{
    use AuthorizesRequests, ValidatesRequests;

    protected function user(): ?User
    {
        /** @var User|null */
        return auth('sanctum')->user();
    }

    /**
     * Başarılı (Succcess) Response Helper
     */
    protected function successResponse(mixed $data, ?string $message = null, int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message ?? 'İşlem başarılı.',
            'data' => $data,
        ], $code);
    }

    /**
     * Hatalı (Error) Response Helper
     *
     * - Geçersiz HTTP kodları (0, MySQL hata kodları vb.) 400'e çekilir.
     * - Production ortamında 5xx hataları iç mesajı sızdırmaz.
     */
    protected function errorResponse(string $message, int $code = 400): JsonResponse
    {
        // Geçerli HTTP durum kodları aralığına zorla
        $validHttpCodes = [400, 401, 403, 404, 409, 422, 429, 500, 502, 503];
        if (in_array($code, $validHttpCodes)) {
            $statusCode = $code;
        } elseif ($code >= 100 && $code < 600) {
            $statusCode = $code;
        } else {
            $statusCode = 400;
        }

        // Production'da 5xx hatalarında iç mesajları gizle (H-2 güvenlik)
        if ($statusCode >= 500 && app()->isProduction()) {
            $message = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
        }

        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
        ], $statusCode);
    }

    /**
     * Sayfalı (Pagination) Response Helper
     *
     * ResourceCollection veya plain paginator kabul eder.
     * data alanı her zaman düz dizi döner.
     */
    protected function paginatedResponse(mixed $collection): JsonResponse
    {
        if ($collection instanceof \Illuminate\Http\Resources\Json\ResourceCollection) {
            $paginator = $collection->resource;
            // Get the resource class - collects is a property, not a method
            $resourceClass = $collection->collects;
            $data = collect($paginator->items())->map(fn ($item) => (new $resourceClass($item))->resolve(request()));
        } else {
            $paginator = $collection;
            $data = collect($paginator->items());
        }

        return response()->json([
            'success' => true,
            'message' => 'Veriler başarıyla listelendi.',
            'data' => $data,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 200);
    }
}
