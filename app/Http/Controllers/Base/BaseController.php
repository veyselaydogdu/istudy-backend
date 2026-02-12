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
     */
    protected function paginatedResponse(mixed $collection): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Veriler başarıyla listelendi.',
            'data' => $collection,
            'meta' => [
                'current_page' => $collection->currentPage(),
                'last_page' => $collection->lastPage(),
                'per_page' => $collection->perPage(),
                'total' => $collection->total(),
            ],
        ], 200);
    }
}
