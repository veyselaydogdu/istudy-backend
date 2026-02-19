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

    protected function user(): User
    {
        /** @var User */
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
     */
    protected function errorResponse(string $message, int $code = 400): JsonResponse
    {
        // Code 0 gelirse 500 yap, yoksa code kullan, ancak HTTP statuslarda 0 geçersiz.
        // Throwable getCode() bazen 0 döner.
        $statusCode = ($code > 0 && $code < 600) ? $code : 400;

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
            $data = collect($collection->toArray(request())['data'] ?? []);
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
